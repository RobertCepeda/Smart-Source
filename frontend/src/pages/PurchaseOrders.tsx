import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, CheckCircle2, ClipboardList, Plus, Send, Trash2, XCircle } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createPurchaseOrderRequest,
  listCatalogItemsRequest,
  listPurchaseOrdersRequest,
  listSuppliersRequest,
  updatePurchaseOrderStatusRequest,
  type CatalogItem,
  type PurchaseOrder,
  type PurchaseOrderPayload,
  type PurchaseOrderStatus,
  type Supplier,
} from "../services/api";

type LineForm = {
  itemId: string;
  quantity: string;
  unitPrice: string;
};

const emptyLine: LineForm = {
  itemId: "",
  quantity: "1",
  unitPrice: "",
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

const statusTone: Record<PurchaseOrderStatus, "slate" | "green" | "amber" | "blue"> = {
  BORRADOR: "slate",
  ENVIADA: "blue",
  RECIBIDA: "green",
  CANCELADA: "amber",
};

export function PurchaseOrders() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("DOP");
  const [taxRate, setTaxRate] = useState("0.18");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineForm[]>([{ ...emptyLine }]);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");
  const [notice, setNotice] = useState<string | null>(null);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "order-form"],
    queryFn: () => listSuppliersRequest(token!),
    enabled: Boolean(token),
  });

  const itemsQuery = useQuery({
    queryKey: ["catalog-items", "order-form"],
    queryFn: () => listCatalogItemsRequest(token!),
    enabled: Boolean(token),
  });

  const ordersQuery = useQuery({
    queryKey: ["purchase-orders", statusFilter],
    queryFn: () => listPurchaseOrdersRequest(token!, statusFilter ? { status: statusFilter } : {}),
    enabled: Boolean(token),
  });

  const suppliers = useMemo(() => suppliersQuery.data?.suppliers ?? [], [suppliersQuery.data?.suppliers]);
  const items = useMemo(() => itemsQuery.data?.items ?? [], [itemsQuery.data?.items]);
  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId) ?? null;

  useEffect(() => {
    if (!supplierId && suppliers.length) {
      setSupplierId(suppliers[0].id);
    }
  }, [supplierId, suppliers]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
    const tax = subtotal * (Number(taxRate) || 0);
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [lines, taxRate]);

  const stats = useMemo(() => {
    return {
      count: orders.length,
      draft: orders.filter((order) => order.status === "BORRADOR").length,
      sent: orders.filter((order) => order.status === "ENVIADA").length,
      amount: orders.reduce((sum, order) => sum + Number(order.total), 0),
    };
  }, [orders]);

  const createMutation = useMutation({
    mutationFn: (payload: PurchaseOrderPayload) => createPurchaseOrderRequest(token!, payload),
    onSuccess: async ({ order }) => {
      setNotice(`Orden ${order.number} creada correctamente.`);
      setNotes("");
      setLines([{ ...emptyLine }]);
      await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos crear la orden."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      updatePurchaseOrderStatusRequest(token!, id, status),
    onSuccess: async ({ order }) => {
      setNotice(`Orden ${order.number} actualizada a ${statusLabels[order.status]}.`);
      await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos actualizar la orden."),
  });

  function updateLine(index: number, key: keyof LineForm, value: string) {
    setNotice(null);
    setLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) {
          return line;
        }

        if (key === "itemId") {
          const supplierItem = selectedSupplier?.catalogItems.find((item) => item.id === value);
          return {
            ...line,
            itemId: value,
            unitPrice: supplierItem?.lastPrice ?? line.unitPrice,
          };
        }

        return { ...line, [key]: value };
      }),
    );
  }

  function addLine() {
    setLines((current) => [...current, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const validLines = lines
      .filter((line) => line.itemId && Number(line.quantity) > 0)
      .map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice) || 0,
      }));

    if (!supplierId) {
      setNotice("Selecciona un suplidor para crear la orden.");
      return;
    }

    if (!validLines.length) {
      setNotice("Agrega al menos una linea con item y cantidad.");
      return;
    }

    createMutation.mutate({
      supplierId,
      currency,
      taxRate: Number(taxRate) || 0,
      notes,
      lines: validLines,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 4"
        title="Órdenes de Compra"
        description="Crea órdenes con suplidor, líneas, precios, ITBIS y seguimiento de estado."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Órdenes" value={stats.count.toString()} />
        <MetricCard label="Borradores" value={stats.draft.toString()} />
        <MetricCard label="Enviadas" value={stats.sent.toString()} />
        <MetricCard label="Monto listado" value={formatMoney(stats.amount, currency)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Nueva orden</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitOrder}>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Suplidor</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                  >
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Moneda</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">ITBIS</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                  >
                    <option value="0.18">18%</option>
                    <option value="0">0%</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate-700">Lineas</p>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                {lines.map((line, index) => (
                  <OrderLineEditor
                    key={index}
                    index={index}
                    line={line}
                    items={items}
                    selectedSupplier={selectedSupplier}
                    onUpdate={updateLine}
                    onRemove={removeLine}
                  />
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Notas</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Condiciones, instrucciones de entrega o referencia interna."
                />
              </label>

              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <TotalRow label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
                <TotalRow label="ITBIS" value={formatMoney(totals.tax, currency)} />
                <div className="mt-2 border-t border-border pt-2">
                  <TotalRow label="Total" value={formatMoney(totals.total, currency)} strong />
                </div>
              </div>

              {notice ? (
                <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
                  {notice}
                </div>
              ) : null}

              <Button type="submit" disabled={createMutation.isPending}>
                <ClipboardList className="h-4 w-4" />
                {createMutation.isPending ? "Creando..." : "Crear orden"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-ink">Órdenes registradas</h2>
            <select
              className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PurchaseOrderStatus | "")}
            >
              <option value="">Todos los estados</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ENVIADA">Enviada</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordersQuery.isLoading ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Cargando órdenes...
              </p>
            ) : null}

            {!ordersQuery.isLoading && !orders.length ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Aún no hay órdenes con este filtro.
              </p>
            ) : null}

            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={(status) => statusMutation.mutate({ id: order.id, status })}
                isUpdating={statusMutation.isPending}
              />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OrderLineEditor({
  index,
  line,
  items,
  selectedSupplier,
  onUpdate,
  onRemove,
}: {
  index: number;
  line: LineForm;
  items: CatalogItem[];
  selectedSupplier: Supplier | null;
  onUpdate: (index: number, key: keyof LineForm, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const supplierItemIds = new Set(selectedSupplier?.catalogItems.map((item) => item.id) ?? []);
  const orderedItems = [...items].sort((a, b) => {
    const aLinked = supplierItemIds.has(a.id) ? 0 : 1;
    const bLinked = supplierItemIds.has(b.id) ? 0 : 1;
    return aLinked - bLinked || a.name.localeCompare(b.name);
  });
  const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);

  return (
    <div className="grid gap-2 rounded-lg border border-border p-3 lg:grid-cols-[1fr_90px_110px_100px_36px] lg:items-end">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Item</span>
        <select
          className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
          value={line.itemId}
          onChange={(event) => onUpdate(index, "itemId", event.target.value)}
        >
          <option value="">Seleccionar</option>
          {orderedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {supplierItemIds.has(item.id) ? " - suplidor" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Cant.</span>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={line.quantity}
          onChange={(event) => onUpdate(index, "quantity", event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Precio</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={line.unitPrice}
          onChange={(event) => onUpdate(index, "unitPrice", event.target.value)}
        />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Total</span>
        <div className="flex h-9 items-center rounded-lg bg-slate-50 px-3 text-[13px] font-bold text-ink">
          {lineTotal.toFixed(2)}
        </div>
      </div>
      <Button type="button" variant="outline" size="icon" title="Quitar linea" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function OrderCard({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: PurchaseOrder;
  onStatusChange: (status: PurchaseOrderStatus) => void;
  isUpdating: boolean;
}) {
  const actions = nextStatusActions(order.status);

  return (
    <div className="rounded-lg border border-border p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">{order.number}</p>
            <Badge tone={statusTone[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-slate-600">{order.supplier.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(order.issueDate).toLocaleDateString()} - {order.lines.length} líneas
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-base font-bold text-ink">{formatMoney(Number(order.total), order.currency)}</p>
          <p className="mt-1 text-xs text-slate-500">
            ITBIS {formatMoney(Number(order.tax), order.currency)}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {order.lines.slice(0, 3).map((line) => (
          <div key={line.id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="truncate">{line.item.name}</span>
            <span className="shrink-0 font-semibold">{formatMoney(Number(line.lineTotal), order.currency)}</span>
          </div>
        ))}
      </div>

      {actions.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
              type="button"
              variant={action.variant}
              size="sm"
              disabled={isUpdating}
              onClick={() => onStatusChange(action.status)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function nextStatusActions(status: PurchaseOrderStatus) {
  if (status === "BORRADOR") {
    return [
      { status: "ENVIADA" as const, label: "Enviar", icon: Send, variant: "secondary" as const },
      { status: "CANCELADA" as const, label: "Cancelar", icon: XCircle, variant: "outline" as const },
    ];
  }

  if (status === "ENVIADA") {
    return [
      { status: "RECIBIDA" as const, label: "Recibir", icon: CheckCircle2, variant: "secondary" as const },
      { status: "CANCELADA" as const, label: "Cancelar", icon: XCircle, variant: "outline" as const },
    ];
  }

  return [];
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Calculator className="mb-2.5 h-5 w-5 text-brand-700" />
        <p className="text-[13px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-bold text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className={strong ? "font-bold text-ink" : "font-semibold text-slate-600"}>{label}</span>
      <span className={strong ? "font-bold text-ink" : "font-semibold text-slate-700"}>{value}</span>
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

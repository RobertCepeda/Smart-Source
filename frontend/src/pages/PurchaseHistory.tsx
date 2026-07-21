import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Filter, PackageCheck, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  listPurchaseOrdersRequest,
  listSuppliersRequest,
  type PurchaseOrder,
  type PurchaseOrderFilters,
  type PurchaseOrderStatus,
} from "../services/api";

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

export function PurchaseHistory() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filters = useMemo<PurchaseOrderFilters>(
    () => ({
      search: search.trim() || undefined,
      supplierId: supplierId || undefined,
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo, search, status, supplierId],
  );

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "history-filter"],
    queryFn: () => listSuppliersRequest(token!),
    enabled: Boolean(token),
  });

  const ordersQuery = useQuery({
    queryKey: ["purchase-history", filters],
    queryFn: () => listPurchaseOrdersRequest(token!, filters),
    enabled: Boolean(token),
  });

  const suppliers = useMemo(() => suppliersQuery.data?.suppliers ?? [], [suppliersQuery.data?.suppliers]);
  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;

  useEffect(() => {
    if (!selectedOrderId && orders.length) {
      setSelectedOrderId(orders[0].id);
      return;
    }

    if (selectedOrderId && orders.length && !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const stats = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const received = orders.filter((order) => order.status === "RECIBIDA").length;
    const sent = orders.filter((order) => order.status === "ENVIADA").length;

    return {
      count: orders.length,
      total,
      received,
      sent,
      average: orders.length ? total / orders.length : 0,
    };
  }, [orders]);

  function resetFilters() {
    setSearch("");
    setSupplierId("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 5"
        title="Historial"
        description="Consulta órdenes por suplidor, estado, fecha, monto y detalle de cada compra."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[1.3fr_1fr_160px_150px_150px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar numero, suplidor, RNC, item o nota"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          >
            <option value="">Todos los suplidores</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
            value={status}
            onChange={(event) => setStatus(event.target.value as PurchaseOrderStatus | "")}
          >
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ENVIADA">Enviada</option>
            <option value="RECIBIDA">Recibida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />

          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Órdenes filtradas" value={stats.count.toString()} icon={Filter} />
        <MetricCard label="Monto total" value={formatMoney(stats.total, selectedOrder?.currency ?? "DOP")} icon={FileText} />
        <MetricCard label="Promedio" value={formatMoney(stats.average, selectedOrder?.currency ?? "DOP")} icon={CalendarDays} />
        <MetricCard label="Recibidas / enviadas" value={`${stats.received} / ${stats.sent}`} icon={PackageCheck} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-bold text-ink">Linea de tiempo</h2>
            <Badge tone="slate">{orders.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersQuery.isLoading ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Cargando historial...
              </p>
            ) : null}

            {!ordersQuery.isLoading && !orders.length ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                No hay compras con esos filtros.
              </p>
            ) : null}

            {orders.map((order) => (
              <TimelineOrder
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Detalle de compra</h2>
          </CardHeader>
          <CardContent>
            {selectedOrder ? (
              <OrderDetail order={selectedOrder} />
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Selecciona una orden para ver el detalle.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TimelineOrder({
  order,
  isSelected,
  onClick,
}: {
  order: PurchaseOrder;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded-lg border p-3 text-left transition ${
        isSelected ? "border-brand-500 bg-brand-50" : "border-border bg-white hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">{order.number}</p>
            <Badge tone={statusTone[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-600">{order.supplier.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(order.issueDate)} - {order.lines.length} líneas
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-ink">{formatMoney(Number(order.total), order.currency)}</p>
      </div>
    </button>
  );
}

function OrderDetail({ order }: { order: PurchaseOrder }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-ink">{order.number}</p>
              <Badge tone={statusTone[order.status]}>{statusLabels[order.status]}</Badge>
            </div>
            <p className="mt-2 text-[13px] font-semibold text-slate-700">{order.supplier.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {compact([order.supplier.rnc, order.supplier.city, order.supplier.category]).join(" - ") || "Sin datos adicionales"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-bold text-ink">{formatMoney(Number(order.total), order.currency)}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(order.issueDate)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_80px_110px_110px] gap-3 border-b border-border bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          <span>Item</span>
          <span className="text-right">Cant.</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Total</span>
        </div>
        <div className="divide-y divide-border">
          {order.lines.map((line) => (
            <div key={line.id} className="grid grid-cols-[1fr_80px_110px_110px] gap-3 px-3 py-3 text-[13px]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{line.item.name}</p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {compact([line.item.category?.name, line.item.brand?.name, line.item.unit]).join(" - ") || "Sin categoría"}
                </p>
              </div>
              <span className="text-right text-slate-600">{Number(line.quantity).toLocaleString("es-DO")}</span>
              <span className="text-right text-slate-600">{formatMoney(Number(line.unitPrice), order.currency)}</span>
              <span className="text-right font-bold text-ink">{formatMoney(Number(line.lineTotal), order.currency)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-auto max-w-sm rounded-lg border border-border p-3">
        <TotalRow label="Subtotal" value={formatMoney(Number(order.subtotal), order.currency)} />
        <TotalRow label="ITBIS" value={formatMoney(Number(order.tax), order.currency)} />
        <div className="mt-2 border-t border-border pt-2">
          <TotalRow label="Total" value={formatMoney(Number(order.total), order.currency)} strong />
        </div>
      </div>

      {order.notes ? (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Notas</p>
          <p className="mt-2 text-[13px] leading-6 text-slate-700">{order.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Filter;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2.5 h-5 w-5 text-brand-700" />
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

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

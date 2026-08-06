import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Boxes, MapPin, PackageCheck, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createInventoryMovementRequest, createWarehouseRequest, listCatalogItemsRequest, listWarehousesRequest } from "../services/api";

export function Warehouses() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: "", code: "", type: "GENERAL" as "GENERAL" | "PROJECT", project: "", location: "" });
  const [movementForm, setMovementForm] = useState({ itemId: "", type: "SALIDA" as "SALIDA" | "AJUSTE", quantity: "", reference: "", notes: "" });
  const [notice, setNotice] = useState<string | null>(null);

  const warehousesQuery = useQuery({ queryKey: ["warehouses"], queryFn: () => listWarehousesRequest(token!), enabled: Boolean(token) });
  const itemsQuery = useQuery({ queryKey: ["catalog-items", "warehouse"], queryFn: () => listCatalogItemsRequest(token!), enabled: Boolean(token) });
  const warehouses = useMemo(() => warehousesQuery.data?.warehouses ?? [], [warehousesQuery.data?.warehouses]);
  const selected = warehouses.find((warehouse) => warehouse.id === selectedId) ?? warehouses[0];

  useEffect(() => {
    if (!selectedId && warehouses[0]) setSelectedId(warehouses[0].id);
  }, [selectedId, warehouses]);

  const totals = useMemo(() => ({
    warehouses: warehouses.length,
    products: warehouses.reduce((sum, warehouse) => sum + warehouse.balances.length, 0),
    units: warehouses.reduce((sum, warehouse) => sum + warehouse.balances.reduce((subtotal, balance) => subtotal + Number(balance.quantity), 0), 0),
  }), [warehouses]);

  const createMutation = useMutation({
    mutationFn: () => createWarehouseRequest(token!, warehouseForm),
    onSuccess: async ({ warehouse }) => {
      setSelectedId(warehouse.id);
      setWarehouseForm({ name: "", code: "", type: "GENERAL", project: "", location: "" });
      setShowCreate(false);
      setNotice("Almacén creado correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo crear el almacén."),
  });

  const movementMutation = useMutation({
    mutationFn: () => createInventoryMovementRequest(token!, selected.id, { ...movementForm, quantity: Number(movementForm.quantity) }),
    onSuccess: async () => {
      setMovementForm({ itemId: "", type: "SALIDA", quantity: "", reference: "", notes: "" });
      setNotice("Movimiento registrado en el historial.");
      await queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo registrar el movimiento."),
  });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Inventario" title="Almacenes" description="Controla dónde entra, se ubica y sale cada material comprado." actions={<Button type="button" onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />Nuevo almacén</Button>} />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Almacenes activos" value={totals.warehouses.toString()} icon={WarehouseIcon} />
        <Metric label="Productos con existencia" value={totals.products.toString()} icon={Boxes} />
        <Metric label="Unidades registradas" value={totals.units.toLocaleString("es-DO", { maximumFractionDigits: 2 })} icon={PackageCheck} />
      </section>

      {showCreate ? (
        <Card>
          <CardHeader><h2 className="text-sm font-bold text-ink">Nuevo almacén</h2></CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }}>
              <Input placeholder="Nombre" value={warehouseForm.name} onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))} required />
              <Input placeholder="Código, ej. AG-01" value={warehouseForm.code} onChange={(event) => setWarehouseForm((current) => ({ ...current, code: event.target.value }))} required />
              <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={warehouseForm.type} onChange={(event) => setWarehouseForm((current) => ({ ...current, type: event.target.value as "GENERAL" | "PROJECT" }))}><option value="GENERAL">General</option><option value="PROJECT">Proyecto</option></select>
              <Input placeholder="Proyecto (opcional)" value={warehouseForm.project} onChange={(event) => setWarehouseForm((current) => ({ ...current, project: event.target.value }))} />
              <div className="flex gap-2"><Input placeholder="Ubicación" value={warehouseForm.location} onChange={(event) => setWarehouseForm((current) => ({ ...current, location: event.target.value }))} /><Button type="submit" disabled={createMutation.isPending}>Guardar</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader><h2 className="text-sm font-bold text-ink">Ubicaciones</h2></CardHeader>
          <CardContent className="space-y-2">
            {warehouses.map((warehouse) => <button key={warehouse.id} type="button" className={`w-full rounded-lg border p-3 text-left transition ${selected?.id === warehouse.id ? "border-brand-200 bg-brand-50" : "border-border hover:bg-slate-50"}`} onClick={() => setSelectedId(warehouse.id)}><div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold text-ink">{warehouse.name}</p><Badge>{warehouse.code}</Badge></div><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{warehouse.location || warehouse.project || "Sin ubicación"}</p></button>)}
            {!warehouses.length ? <p className="text-[13px] text-slate-500">Crea el primer almacén para recibir órdenes.</p> : null}
          </CardContent>
        </Card>

        {selected ? <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><div><h2 className="text-base font-bold text-ink">{selected.name}</h2><p className="mt-1 text-xs text-slate-500">Existencia actual por producto</p></div><Badge tone="green">{selected.type === "PROJECT" ? "Proyecto" : "General"}</Badge></CardHeader>
            <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[13px]"><thead className="border-y border-border bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3 text-right">Existencia</th></tr></thead><tbody className="divide-y divide-border">{selected.balances.map((balance) => <tr key={balance.id}><td className="px-4 py-3 font-semibold text-ink">{balance.item.name}</td><td className="px-4 py-3 text-slate-500">{balance.item.category?.name || "-"}</td><td className="px-4 py-3 text-slate-500">{balance.item.unit || "-"}</td><td className="px-4 py-3 text-right font-bold text-ink">{Number(balance.quantity).toLocaleString("es-DO")}</td></tr>)}{!selected.balances.length ? <tr><td colSpan={4} className="p-6 text-center text-slate-500">Todavía no hay productos recibidos.</td></tr> : null}</tbody></table></div></CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-bold text-ink">Registrar salida o ajuste</h2></CardHeader>
            <CardContent><form className="grid gap-3 lg:grid-cols-[1fr_140px_130px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); movementMutation.mutate(); }}><select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={movementForm.itemId} onChange={(event) => setMovementForm((current) => ({ ...current, itemId: event.target.value }))} required><option value="">Selecciona un producto</option>{(itemsQuery.data?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={movementForm.type} onChange={(event) => setMovementForm((current) => ({ ...current, type: event.target.value as "SALIDA" | "AJUSTE" }))}><option value="SALIDA">Salida</option><option value="AJUSTE">Ajuste</option></select><Input type="number" step="0.01" placeholder="Cantidad" value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} required /><Input placeholder="Referencia o destino" value={movementForm.reference} onChange={(event) => setMovementForm((current) => ({ ...current, reference: event.target.value }))} /><Button type="submit" disabled={movementMutation.isPending}><ArrowDownToLine className="h-4 w-4" />Registrar</Button></form></CardContent>
          </Card>

          <Card><CardHeader><h2 className="text-sm font-bold text-ink">Últimos movimientos</h2></CardHeader><CardContent className="space-y-2">{selected.movements.map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"><div><p className="text-[13px] font-semibold text-ink">{movement.item.name}</p><p className="mt-1 text-xs text-slate-500">{movement.reference || movement.order?.number || "Movimiento manual"} · {new Date(movement.createdAt).toLocaleString("es-DO")}</p></div><Badge tone={movement.type === "ENTRADA" ? "green" : movement.type === "SALIDA" ? "amber" : "blue"}>{movement.type} {movement.quantity}</Badge></div>)}{!selected.movements.length ? <p className="text-[13px] text-slate-500">Sin movimientos registrados.</p> : null}</CardContent></Card>
        </div> : null}
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WarehouseIcon }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-lg font-bold text-ink">{value}</p></div></CardContent></Card>;
}

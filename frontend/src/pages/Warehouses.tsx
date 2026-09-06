import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowLeftRight, Boxes, CheckCircle2, MapPin, PackageCheck, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createInventoryMovementRequest,
  createInventoryTransferRequest,
  createWarehouseRequest,
  getOrganizationWorkspaceRequest,
  listCatalogItemsRequest,
  listInventoryTransfersRequest,
  listWarehousesRequest,
  receiveInventoryTransferRequest,
} from "../services/api";

type ViewMode = "inventory" | "transfers";

export function Warehouses() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("inventory");
  const [selectedId, setSelectedId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: "", code: "", type: "GENERAL" as "GENERAL" | "PROJECT", location: "" });
  const [movementForm, setMovementForm] = useState({ itemId: "", type: "SALIDA" as "SALIDA" | "AJUSTE", quantity: "", reference: "", notes: "" });
  const [transferForm, setTransferForm] = useState({ originWarehouseId: "", destinationWarehouseId: "", itemId: "", driverId: "", quantity: "", notes: "" });
  const [notice, setNotice] = useState<string | null>(null);

  const warehousesQuery = useQuery({ queryKey: ["warehouses"], queryFn: () => listWarehousesRequest(token!), enabled: Boolean(token) });
  const itemsQuery = useQuery({ queryKey: ["catalog-items", "warehouse"], queryFn: () => listCatalogItemsRequest(token!), enabled: Boolean(token) });
  const transfersQuery = useQuery({ queryKey: ["inventory-transfers"], queryFn: () => listInventoryTransfersRequest(token!), enabled: Boolean(token), refetchInterval: 5000 });
  const organizationQuery = useQuery({ queryKey: ["organization-workspace", "warehouse-drivers"], queryFn: () => getOrganizationWorkspaceRequest(token!), enabled: Boolean(token) });
  const warehouses = useMemo(() => warehousesQuery.data?.warehouses ?? [], [warehousesQuery.data?.warehouses]);
  const selected = warehouses.find((warehouse) => warehouse.id === selectedId) ?? warehouses[0];
  const origin = warehouses.find((warehouse) => warehouse.id === transferForm.originWarehouseId) ?? null;

  useEffect(() => {
    if (!selectedId && warehouses[0]) setSelectedId(warehouses[0].id);
    if (!transferForm.originWarehouseId && warehouses[0]) {
      setTransferForm((current) => ({ ...current, originWarehouseId: warehouses[0].id, destinationWarehouseId: warehouses[1]?.id ?? "" }));
    }
    const firstDriver = organizationQuery.data?.users.find((entry) => entry.isActive);
    if (!transferForm.driverId && firstDriver) setTransferForm((current) => ({ ...current, driverId: firstDriver.id }));
  }, [organizationQuery.data?.users, selectedId, transferForm.driverId, transferForm.originWarehouseId, warehouses]);

  const totals = useMemo(() => ({
    warehouses: warehouses.length,
    products: warehouses.reduce((sum, warehouse) => sum + warehouse.balances.length, 0),
    units: warehouses.reduce((sum, warehouse) => sum + warehouse.balances.reduce((subtotal, balance) => subtotal + Number(balance.quantity), 0), 0),
  }), [warehouses]);

  const createMutation = useMutation({
    mutationFn: () => createWarehouseRequest(token!, warehouseForm),
    onSuccess: async ({ warehouse }) => {
      setSelectedId(warehouse.id);
      setWarehouseForm({ name: "", code: "", type: "GENERAL", location: "" });
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
  const transferMutation = useMutation({
    mutationFn: () => createInventoryTransferRequest(token!, { ...transferForm, quantity: Number(transferForm.quantity) }),
    onSuccess: async () => {
      setTransferForm((current) => ({ ...current, itemId: "", quantity: "", notes: "" }));
      setNotice("Transferencia despachada. El destino debe confirmar la entrada.");
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["warehouses"] }), queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })]);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo realizar la transferencia."),
  });
  const receiveTransferMutation = useMutation({
    mutationFn: (transferId: string) => receiveInventoryTransferRequest(token!, transferId),
    onSuccess: async () => {
      setNotice("Material recibido e ingresado al almacén de destino.");
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["warehouses"] }), queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })]);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo confirmar la recepción."),
  });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Inventario" title="Almacenes" description="Controla existencias, movimientos y transferencias entre ubicaciones." actions={<Button type="button" onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />Nuevo almacén</Button>} />
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Almacenes activos" value={totals.warehouses.toString()} icon={WarehouseIcon} />
        <Metric label="Productos con existencia" value={totals.products.toString()} icon={Boxes} />
        <Metric label="Unidades registradas" value={totals.units.toLocaleString("es-DO", { maximumFractionDigits: 2 })} icon={PackageCheck} />
      </section>
      <div className="flex w-fit gap-1 rounded-lg border border-border bg-white p-1">
        <Button type="button" size="sm" variant={viewMode === "inventory" ? "default" : "ghost"} onClick={() => setViewMode("inventory")}><Boxes className="h-4 w-4" />Existencias</Button>
        <Button type="button" size="sm" variant={viewMode === "transfers" ? "default" : "ghost"} onClick={() => setViewMode("transfers")}><ArrowLeftRight className="h-4 w-4" />Transferencias</Button>
      </div>

      {showCreate ? <NewWarehouseCard form={warehouseForm} setForm={setWarehouseForm} isPending={createMutation.isPending} onSubmit={() => createMutation.mutate()} /> : null}
      {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</div> : null}

      {viewMode === "inventory" ? (
        <section className="grid gap-4 xl:grid-cols-[240px_1fr]">
          <Card>
            <CardHeader><h2 className="text-sm font-bold text-ink">Ubicaciones</h2></CardHeader>
            <CardContent className="space-y-2">
              {warehouses.map((warehouse) => <button key={warehouse.id} type="button" className={`w-full rounded-lg border p-3 text-left transition ${selected?.id === warehouse.id ? "border-brand-200 bg-brand-50" : "border-border hover:bg-slate-50"}`} onClick={() => setSelectedId(warehouse.id)}><div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold text-ink">{warehouse.name}</p><Badge>{warehouse.code}</Badge></div><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{warehouse.location || "Sin ubicación"}</p></button>)}
              {!warehouses.length ? <p className="text-[13px] text-slate-500">Crea el primer almacén para recibir órdenes.</p> : null}
            </CardContent>
          </Card>
          {selected ? <div className="space-y-4">
            <InventoryCard warehouse={selected} />
            <Card><CardHeader><h2 className="text-sm font-bold text-ink">Registrar salida o ajuste</h2></CardHeader><CardContent><form className="grid gap-3 lg:grid-cols-[1fr_140px_130px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); movementMutation.mutate(); }}><select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={movementForm.itemId} onChange={(event) => setMovementForm((current) => ({ ...current, itemId: event.target.value }))} required><option value="">Selecciona un producto</option>{(itemsQuery.data?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={movementForm.type} onChange={(event) => setMovementForm((current) => ({ ...current, type: event.target.value as "SALIDA" | "AJUSTE" }))}><option value="SALIDA">Salida</option><option value="AJUSTE">Ajuste</option></select><Input type="number" min="0.01" step="0.01" placeholder="Cantidad" value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} required /><Input placeholder="Referencia o destino" value={movementForm.reference} onChange={(event) => setMovementForm((current) => ({ ...current, reference: event.target.value }))} /><Button type="submit" disabled={movementMutation.isPending}><ArrowDownToLine className="h-4 w-4" />Registrar</Button></form></CardContent></Card>
            <MovementsCard movements={selected.movements} />
          </div> : null}
        </section>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="text-sm font-bold text-ink">Transferir materiales</h2><p className="mt-1 text-xs text-slate-500">Se descuenta del origen al despachar y se suma al destino cuando confirman la recepción.</p></CardHeader>
            <CardContent><form className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_120px_auto]" onSubmit={(event) => { event.preventDefault(); transferMutation.mutate(); }}><SelectField label="Origen" value={transferForm.originWarehouseId} onChange={(value) => setTransferForm((current) => ({ ...current, originWarehouseId: value, itemId: "", destinationWarehouseId: current.destinationWarehouseId === value ? "" : current.destinationWarehouseId }))}><option value="">Selecciona origen</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}</SelectField><SelectField label="Destino" value={transferForm.destinationWarehouseId} onChange={(value) => setTransferForm((current) => ({ ...current, destinationWarehouseId: value }))}><option value="">Selecciona destino</option>{warehouses.filter((warehouse) => warehouse.id !== transferForm.originWarehouseId).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}</SelectField><SelectField label="Insumo disponible" value={transferForm.itemId} onChange={(value) => setTransferForm((current) => ({ ...current, itemId: value }))}><option value="">Selecciona insumo</option>{(origin?.balances ?? []).map((balance) => <option key={balance.itemId} value={balance.itemId}>{balance.item.name} · {Number(balance.quantity).toLocaleString("es-DO")} disp.</option>)}</SelectField><SelectField label="Chofer responsable" value={transferForm.driverId} onChange={(value) => setTransferForm((current) => ({ ...current, driverId: value }))}><option value="">Selecciona un empleado</option>{(organizationQuery.data?.users ?? []).filter((entry) => entry.isActive).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</SelectField><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Cantidad</span><Input type="number" min="0.01" step="0.01" value={transferForm.quantity} onChange={(event) => setTransferForm((current) => ({ ...current, quantity: event.target.value }))} required /></label><div className="flex items-end"><Button type="submit" className="w-full" disabled={transferMutation.isPending || warehouses.length < 2}><ArrowLeftRight className="h-4 w-4" />Despachar</Button></div></form><Input className="mt-3" placeholder="Nota opcional de la transferencia" value={transferForm.notes} onChange={(event) => setTransferForm((current) => ({ ...current, notes: event.target.value }))} /></CardContent>
          </Card>
          <TransfersTable transfers={transfersQuery.data?.transfers ?? []} isReceiving={receiveTransferMutation.isPending} onReceive={(id) => receiveTransferMutation.mutate(id)} />
        </div>
      )}
    </div>
  );
}

function NewWarehouseCard({ form, setForm, isPending, onSubmit }: { form: { name: string; code: string; type: "GENERAL" | "PROJECT"; location: string }; setForm: React.Dispatch<React.SetStateAction<{ name: string; code: string; type: "GENERAL" | "PROJECT"; location: string }>>; isPending: boolean; onSubmit: () => void }) {
  return <Card><CardHeader><h2 className="text-sm font-bold text-ink">Nuevo almacén</h2></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-[1fr_150px_150px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Input placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /><Input placeholder="Código" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required /><select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as "GENERAL" | "PROJECT" }))}><option value="GENERAL">General</option><option value="PROJECT">De proyecto</option></select><Input placeholder="Ubicación" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /><Button type="submit" disabled={isPending}>Guardar</Button></form></CardContent></Card>;
}

function InventoryCard({ warehouse }: { warehouse: Awaited<ReturnType<typeof listWarehousesRequest>>["warehouses"][number] }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between"><div><h2 className="text-base font-bold text-ink">{warehouse.name}</h2><p className="mt-1 text-xs text-slate-500">Existencia actual por producto</p></div><Badge tone="green">{warehouse.type === "PROJECT" ? "Proyecto" : "General"}</Badge></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[13px]"><thead className="border-y border-border bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3 text-right">Existencia</th></tr></thead><tbody className="divide-y divide-border">{warehouse.balances.map((balance) => <tr key={balance.id}><td className="px-4 py-3 font-semibold text-ink">{balance.item.name}</td><td className="px-4 py-3 text-slate-500">{balance.item.category?.name || "-"}</td><td className="px-4 py-3 text-slate-500">{balance.item.unit || "-"}</td><td className="px-4 py-3 text-right font-bold text-ink">{Number(balance.quantity).toLocaleString("es-DO")}</td></tr>)}{!warehouse.balances.length ? <tr><td colSpan={4} className="p-6 text-center text-slate-500">Todavía no hay productos recibidos.</td></tr> : null}</tbody></table></div></CardContent></Card>;
}

function MovementsCard({ movements }: { movements: Awaited<ReturnType<typeof listWarehousesRequest>>["warehouses"][number]["movements"] }) {
  return <Card><CardHeader><h2 className="text-sm font-bold text-ink">Últimos movimientos</h2></CardHeader><CardContent className="space-y-2">{movements.map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"><div><p className="text-[13px] font-semibold text-ink">{movement.item.name}</p><p className="mt-1 text-xs text-slate-500">{movement.reference || movement.order?.number || "Movimiento manual"} · {new Date(movement.createdAt).toLocaleString("es-DO")}</p></div><Badge tone={movement.type.includes("ENTRADA") ? "green" : movement.type.includes("SALIDA") ? "amber" : "blue"}>{movementLabel(movement.type)} · {movement.quantity}</Badge></div>)}{!movements.length ? <p className="text-[13px] text-slate-500">Sin movimientos registrados.</p> : null}</CardContent></Card>;
}

function TransfersTable({ transfers, isReceiving, onReceive }: { transfers: Awaited<ReturnType<typeof listInventoryTransfersRequest>>["transfers"]; isReceiving: boolean; onReceive: (id: string) => void }) {
  return <Card><CardHeader><h2 className="text-sm font-bold text-ink">Transferencias y recepción</h2></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-[13px]"><thead className="border-y border-border bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Insumo</th><th className="px-4 py-3">Ruta</th><th className="px-4 py-3">Creó</th><th className="px-4 py-3">Chofer</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Cantidad</th><th className="px-4 py-3 text-right">Acción</th></tr></thead><tbody className="divide-y divide-border">{transfers.map((transfer) => <tr key={transfer.id}><td className="px-4 py-3 text-slate-500">{new Date(transfer.createdAt).toLocaleString("es-DO")}</td><td className="px-4 py-3 font-semibold text-ink">{transfer.item.name}</td><td className="px-4 py-3">{transfer.originWarehouse.code} → {transfer.destinationWarehouse.code}</td><td className="px-4 py-3 text-slate-600">{transfer.createdBy?.name ?? "Sistema"}</td><td className="px-4 py-3 text-slate-600">{transfer.driver?.name ?? "No registrado"}</td><td className="px-4 py-3"><Badge tone={transfer.status === "RECIBIDA" ? "green" : "amber"}>{transfer.status === "RECIBIDA" ? "Recibida" : "En tránsito"}</Badge>{transfer.receivedBy ? <p className="mt-1 text-[11px] text-slate-500">por {transfer.receivedBy.name}</p> : null}</td><td className="px-4 py-3 text-right font-bold text-ink">{Number(transfer.quantity).toLocaleString("es-DO")} {transfer.unit ?? ""}</td><td className="px-4 py-3 text-right">{transfer.status === "PENDIENTE" ? <Button type="button" size="sm" disabled={isReceiving} onClick={() => onReceive(transfer.id)}><CheckCircle2 className="h-4 w-4" />Dar entrada</Button> : <span className="text-xs text-slate-500">Completada</span>}</td></tr>)}{!transfers.length ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">Aún no hay transferencias registradas.</td></tr> : null}</tbody></table></div></CardContent></Card>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={value} onChange={(event) => onChange(event.target.value)} required>{children}</select></label>;
}

function movementLabel(type: string) {
  if (type === "TRANSFERENCIA_SALIDA") return "Transferencia enviada";
  if (type === "TRANSFERENCIA_ENTRADA") return "Transferencia recibida";
  return type.charAt(0) + type.slice(1).toLocaleLowerCase("es");
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WarehouseIcon }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-lg font-bold text-ink">{value}</p></div></CardContent></Card>;
}

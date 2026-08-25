import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Pencil, Plus, Power, Save, X } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createCostCenterRequest, listCostCentersRequest, updateCostCenterRequest, type CostCenter } from "../services/api";

const emptyForm = { code: "", name: "", description: "" };

export function CostCenters() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["cost-centers"], queryFn: () => listCostCentersRequest(token!), enabled: Boolean(token) });
  const costCenters = query.data?.costCenters ?? [];

  const saveMutation = useMutation({
    mutationFn: () => editingId
      ? updateCostCenterRequest(token!, editingId, form)
      : createCostCenterRequest(token!, form),
    onSuccess: async () => {
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setNotice("Centro de costo guardado correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo guardar el centro de costo."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCostCenterRequest(token!, id, { isActive }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["cost-centers"] }),
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo actualizar el estado."),
  });

  function edit(costCenter: CostCenter) {
    setEditingId(costCenter.id);
    setForm({ code: costCenter.code, name: costCenter.name, description: costCenter.description ?? "" });
    setShowForm(true);
    setNotice(null);
  }

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Empresa"
        title="Centros de costo"
        description="Crea las opciones que se usarán de forma uniforme en solicitudes y órdenes."
        actions={<Button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}><Plus className="h-4 w-4" />Nuevo centro</Button>}
      />

      {showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><h2 className="text-sm font-bold text-ink">{editingId ? "Editar centro de costo" : "Nuevo centro de costo"}</h2><p className="mt-1 text-xs text-slate-500">Código corto, nombre identificable y una nota opcional.</p></div>
            <Button type="button" variant="ghost" size="icon" title="Cerrar" onClick={cancel}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[180px_1fr_1.3fr_auto]" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
              <Input placeholder="Código, ej. CC-204" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required />
              <Input placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              <Input placeholder="Descripción opcional" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              <Button type="submit" disabled={saveMutation.isPending}><Save className="h-4 w-4" />Guardar</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</div> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><h2 className="text-sm font-bold text-ink">Centros registrados</h2><p className="mt-1 text-xs text-slate-500">{costCenters.filter((entry) => entry.isActive).length} activos de {costCenters.length}</p></div>
          <CircleDollarSign className="h-5 w-5 text-brand-600" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-y border-border bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-2.5">Código</th><th className="px-4 py-2.5">Nombre</th><th className="px-4 py-2.5">Descripción</th><th className="px-4 py-2.5">Uso</th><th className="px-4 py-2.5 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-border">
                {costCenters.map((costCenter) => (
                  <tr key={costCenter.id} className={!costCenter.isActive ? "bg-slate-50/70 text-slate-500" : ""}>
                    <td className="px-4 py-3"><Badge tone={costCenter.isActive ? "green" : "slate"}>{costCenter.code}</Badge></td>
                    <td className="px-4 py-3 font-semibold text-ink">{costCenter.name}</td>
                    <td className="px-4 py-3 text-slate-500">{costCenter.description || "Sin descripción"}</td>
                    <td className="px-4 py-3 text-slate-500">{costCenter._count.quoteRequests} solicitudes · {costCenter._count.purchaseOrders} órdenes</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon" title="Editar" onClick={() => edit(costCenter)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" title={costCenter.isActive ? "Desactivar" : "Activar"} onClick={() => statusMutation.mutate({ id: costCenter.id, isActive: !costCenter.isActive })}><Power className={`h-4 w-4 ${costCenter.isActive ? "text-amber-600" : "text-brand-600"}`} /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!costCenters.length ? <p className="p-8 text-center text-[13px] text-slate-500">Crea el primer centro de costo para usarlo en compras.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

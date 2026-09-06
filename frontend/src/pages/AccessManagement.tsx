import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, KeyRound, Plus, Save, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createOrganizationUserRequest, getOrganizationWorkspaceRequest, updateOrganizationUserRequest } from "../services/api";
import { cn } from "../lib/utils";

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerencia" },
  { value: "BUYER", label: "Compras" },
  { value: "WAREHOUSE", label: "Almacén" },
  { value: "VIEWER", label: "Solo lectura" },
  { value: "CLIENT", label: "Cliente" },
];

export function AccessManagement() {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" });
  const canManage = ["OWNER", "ADMIN", "SYSTEM_ADMIN"].includes(currentUser?.role ?? "");

  const workspaceQuery = useQuery({
    queryKey: ["organization-workspace"],
    queryFn: () => getOrganizationWorkspaceRequest(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () => createOrganizationUserRequest(token!, form),
    onSuccess: async () => {
      setForm({ name: "", email: "", password: "", role: "VIEWER" });
      setShowForm(false);
      setNotice("El acceso del empleado fue creado correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo crear el acceso."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, role, isActive }: { userId: string; role: string; isActive?: boolean }) =>
      updateOrganizationUserRequest(token!, userId, { role, isActive }),
    onSuccess: async () => {
      setNotice("Los permisos fueron actualizados.");
      await queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No se pudo actualizar el acceso."),
  });

  const users = workspaceQuery.data?.users ?? [];
  const activeUsers = users.filter((user) => user.isActive).length;
  const administrators = users.filter((user) => ["OWNER", "ADMIN", "SYSTEM_ADMIN"].includes(user.role)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresa"
        title="Accesos"
        description="Crea cuentas para empleados y controla sus permisos dentro de la organización."
        actions={canManage ? <Button type="button" size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Nuevo empleado</Button> : undefined}
      />

      {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-800">{notice}</div> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Summary label="Usuarios" value={users.length} icon={Users} />
        <Summary label="Accesos activos" value={activeUsers} icon={KeyRound} />
        <Summary label="Administradores" value={administrators} icon={ShieldCheck} />
      </section>

      {canManage && showForm ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><h2 className="text-sm font-bold text-ink">Crear acceso</h2><p className="mt-1 text-xs text-slate-500">La contraseña temporal debe tener al menos 8 caracteres.</p></div>
            <Button type="button" variant="ghost" size="icon" title="Cerrar" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_auto]" onSubmit={(event) => { event.preventDefault(); setNotice(null); createMutation.mutate(); }}>
              <Input placeholder="Nombre completo" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              <Input type="email" placeholder="Correo" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              <Input type="password" minLength={8} placeholder="Clave temporal" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
              <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <Button type="submit" disabled={createMutation.isPending}><Save className="h-4 w-4" />{createMutation.isPending ? "Creando..." : "Crear"}</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Usuarios de la organización</h2>
          <p className="mt-1 text-xs text-slate-500">Cada usuario conserva únicamente el nivel de acceso asignado.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map((user) => {
              const isProtected = user.id === currentUser?.id || ["OWNER", "SYSTEM_ADMIN"].includes(user.role);
              return (
                <div key={user.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(220px,1fr)_170px_190px_130px] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><UserRound className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink">{user.name} {user.id === currentUser?.id ? <Badge tone="green">Tu cuenta</Badge> : null}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /><span>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Sin acceso aún"}</span></div>
                  {canManage && !isProtected ? (
                    <select
                      className="h-9 rounded-lg border border-border bg-white px-2 text-xs font-semibold"
                      value={user.role}
                      onChange={(event) => updateMutation.mutate({ userId: user.id, role: event.target.value, isActive: user.isActive })}
                      disabled={updateMutation.isPending}
                      aria-label={`Nivel de acceso de ${user.name}`}
                    >
                      {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : <Badge tone={["OWNER", "ADMIN", "SYSTEM_ADMIN"].includes(user.role) ? "blue" : "slate"}>{roleLabel(user.role)}</Badge>}
                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <span className={cn("text-xs font-semibold", user.isActive ? "text-brand-700" : "text-slate-500")}>{user.isActive ? "Activo" : "Inactivo"}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={user.isActive}
                      aria-label={`${user.isActive ? "Desactivar" : "Activar"} acceso de ${user.name}`}
                      title={isProtected ? "Este acceso está protegido" : user.isActive ? "Desactivar acceso" : "Activar acceso"}
                      disabled={!canManage || isProtected || updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ userId: user.id, role: user.role, isActive: !user.isActive })}
                      className={cn("relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50", user.isActive ? "bg-brand-600" : "bg-slate-300")}
                    >
                      <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition", user.isActive ? "left-6" : "left-1")} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!workspaceQuery.isLoading && !users.length ? <p className="p-6 text-center text-[13px] text-slate-500">No hay usuarios registrados.</p> : null}
            {workspaceQuery.isLoading ? <p className="p-6 text-center text-[13px] text-slate-500">Cargando accesos...</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-ink">{value}</p></div></CardContent></Card>;
}

function roleLabel(role: string) {
  if (role === "OWNER") return "Propietario";
  if (role === "SYSTEM_ADMIN") return "Administrador del sistema";
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Crown, History, Inbox, PackageSearch, ReceiptText, RotateCcw, Users, Warehouse as WarehouseIcon } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { getOrganizationWorkspaceRequest, listAuditLogsRequest, restoreCatalogItemRequest, restoreSupplierRequest, updateOrganizationUserRequest } from "../services/api";

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerencia" },
  { value: "BUYER", label: "Compras" },
  { value: "WAREHOUSE", label: "Almacén" },
  { value: "VIEWER", label: "Solo lectura" },
  { value: "CLIENT", label: "Cliente" },
];

export function Organizations() {
  const { token, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const canManage = currentUser?.role === "OWNER" || currentUser?.role === "ADMIN" || currentUser?.role === "SYSTEM_ADMIN";
  const organizationQuery = useQuery({
    queryKey: ["organization-workspace"],
    queryFn: () => getOrganizationWorkspaceRequest(token!),
    enabled: Boolean(token),
  });

  const auditQuery = useQuery({
    queryKey: ["organization-audit"],
    queryFn: () => listAuditLogsRequest(token!, 60),
    enabled: Boolean(token && canManage),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateOrganizationUserRequest(token!, userId, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-audit"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: string; entityId: string }) => entityType === "SUPPLIER" ? restoreSupplierRequest(token!, entityId) : restoreCatalogItemRequest(token!, entityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-audit"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-workspace"] });
    },
  });

  const workspace = organizationQuery.data;
  const organization = workspace?.organization;
  const users = workspace?.users ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresa"
        title="Organizaciones"
        description="Administra la organización activa, plan, usuarios y separación de datos de la empresa."
      />

      {organization ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">{organization.name}</h2>
                    <Badge tone={organization.status === "ACTIVE" ? "green" : "amber"}>{organization.status}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-slate-600">{organization.billingEmail ?? "Sin correo de facturacion"}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-700">{organization.slug}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoPill label="Tipo" value={organization.accountType === "BUSINESS" ? "Empresarial" : "Personal"} />
                <InfoPill label="Plan" value={organization.plan} />
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Usuarios" value={organization.counts.users.toString()} icon={Users} />
            <MetricCard label="Suplidores" value={organization.counts.suppliers.toString()} icon={Building2} />
            <MetricCard label="Catálogo" value={organization.counts.items.toString()} icon={PackageSearch} />
            <MetricCard label="Órdenes" value={organization.counts.orders.toString()} icon={ReceiptText} />
            <MetricCard label="Solicitudes abiertas" value={organization.counts.openTickets.toString()} icon={Inbox} />
            <MetricCard label="Almacenes" value={organization.counts.warehouses.toString()} icon={WarehouseIcon} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-ink">Usuarios de la organización</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_180px_90px] md:items-center">
                    <div>
                      <p className="text-[13px] font-bold text-ink">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </div>
                    {canManage && !["SYSTEM_ADMIN", "OWNER"].includes(user.role) ? (
                      <select className="h-9 rounded-lg border border-border bg-white px-2 text-xs font-semibold" value={user.role} onChange={(event) => roleMutation.mutate({ userId: user.id, role: event.target.value })} disabled={roleMutation.isPending}>
                        {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : <Badge tone={user.role === "ADMIN" || user.role === "SYSTEM_ADMIN" ? "blue" : "slate"}>{user.role}</Badge>}
                    <Badge tone={user.isActive ? "green" : "amber"}>{user.isActive ? "Activo" : "Inactivo"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-ink">Plan y acceso</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-brand-700" />
                    <p className="text-[13px] font-bold text-ink">{organization.plan}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">
                    Los datos de suplidores, catálogo, órdenes y solicitudes quedan separados por organización.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Creada</p>
                  <p className="mt-2 text-[13px] font-semibold text-ink">{formatDate(organization.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {canManage ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Historial de cambios</h2>
                  <p className="mt-1 text-xs text-slate-500">Usuario, acción y fecha de cada modificación sensible.</p>
                </div>
                <History className="h-5 w-5 text-brand-700" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {(auditQuery.data?.logs ?? []).map((log) => (
                    <div key={log.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">{log.summary}</p>
                        <p className="mt-1 text-xs text-slate-500">{log.user?.name ?? "Sistema"} · {formatDateTime(log.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={log.action === "DELETE" ? "amber" : log.action === "RESTORE" ? "green" : "slate"}>{log.action}</Badge>
                        {log.action === "DELETE" && log.metadata?.restorable && log.entityId && ["SUPPLIER", "ITEM"].includes(log.entityType) ? (
                          <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold" onClick={() => restoreMutation.mutate({ entityType: log.entityType, entityId: log.entityId! })}>
                            <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!auditQuery.isLoading && !(auditQuery.data?.logs.length) ? <p className="p-5 text-center text-[13px] text-slate-500">Todavía no hay cambios registrados.</p> : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-[13px] text-slate-600">Cargando organización...</CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-[13px] font-bold text-ink">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

import { useQuery } from "@tanstack/react-query";
import { Building2, Crown, Inbox, PackageSearch, ReceiptText, Users } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { getOrganizationWorkspaceRequest } from "../services/api";

export function Organizations() {
  const { token } = useAuth();
  const organizationQuery = useQuery({
    queryKey: ["organization-workspace"],
    queryFn: () => getOrganizationWorkspaceRequest(token!),
    enabled: Boolean(token),
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

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Usuarios" value={organization.counts.users.toString()} icon={Users} />
            <MetricCard label="Suplidores" value={organization.counts.suppliers.toString()} icon={Building2} />
            <MetricCard label="Catálogo" value={organization.counts.items.toString()} icon={PackageSearch} />
            <MetricCard label="Órdenes" value={organization.counts.orders.toString()} icon={ReceiptText} />
            <MetricCard label="Solicitudes abiertas" value={organization.counts.openTickets.toString()} icon={Inbox} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-ink">Usuarios de la organización</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_130px_110px] md:items-center">
                    <div>
                      <p className="text-[13px] font-bold text-ink">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Badge tone={user.role === "ADMIN" || user.role === "SYSTEM_ADMIN" ? "blue" : "slate"}>{user.role}</Badge>
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

import { useQuery } from "@tanstack/react-query";
import { Building2, Inbox, LogOut, type LucideIcon, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminOverviewRequest,
  listAdminOrganizationsRequest,
  listAdminSupportTicketsRequest,
} from "../../services/api";

export function AdminDashboard() {
  const { token, logout } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverviewRequest(token!),
    enabled: Boolean(token),
  });

  const organizationsQuery = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: () => listAdminOrganizationsRequest(token!),
    enabled: Boolean(token),
  });

  const ticketsQuery = useQuery({
    queryKey: ["admin-support"],
    queryFn: () => listAdminSupportTicketsRequest(token!),
    enabled: Boolean(token),
  });

  const overview = overviewQuery.data?.overview;
  const organizations = organizationsQuery.data?.organizations ?? [];
  const tickets = ticketsQuery.data?.tickets ?? [];

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-ink md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">Portal privado</p>
            <h1 className="mt-2 text-2xl font-bold">Smart Source Admin</h1>
            <p className="mt-1.5 text-[13px] text-slate-600">
              Clientes, organizaciones y solicitudes centralizadas.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={Building2} label="Organizaciones" value={overview?.organizations ?? 0} />
          <MetricCard icon={Users} label="Usuarios" value={overview?.users ?? 0} />
          <MetricCard icon={Building2} label="Suplidores" value={overview?.suppliers ?? 0} />
          <MetricCard icon={Inbox} label="Solicitudes abiertas" value={overview?.openTickets ?? 0} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold">Organizaciones cliente</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {organizations.map((organization) => (
                <div key={organization.id} className="rounded-lg border border-border p-3.5">
                  <p className="text-[13px] font-bold">{organization.name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {organization.accountType} - {organization.plan}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {organization._count.users} usuarios - {organization._count.suppliers} suplidores -{" "}
                    {organization._count.supportTickets} solicitudes
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-bold">Buzon de solicitudes</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-slate-600">{ticket.organization?.name}</p>
                    </div>
                    <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-slate-600">{ticket.messages[0]?.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2.5 h-5 w-5 text-brand-700" />
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

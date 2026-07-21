import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Building2,
  Headphones,
  PackageSearch,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { PageHeader } from "../components/shared/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import {
  getOrganizationWorkspaceRequest,
  getReportsSummaryRequest,
  type PurchaseOrderStatus,
} from "../services/api";

const chartColors = ["#0F172A", "#10B981", "#38BDF8", "#F59E0B"];

const statusLabels: Record<PurchaseOrderStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

const quickActions = [
  {
    title: "Registrar suplidor",
    description: "Alta guiada en 4 pasos",
    path: "/registration",
    icon: Plus,
  },
  {
    title: "Crear orden",
    description: "Compra con cálculo automático",
    path: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Buscar rápido",
    description: "Suplidores, items y contactos",
    path: "/search",
    icon: Search,
  },
  {
    title: "Centro de Atención",
    description: "Mensajes y soporte",
    path: "/support",
    icon: Headphones,
  },
];

export function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const reportQuery = useQuery({
    queryKey: ["dashboard-reports"],
    queryFn: () => getReportsSummaryRequest(token!),
    enabled: Boolean(token),
  });

  const organizationQuery = useQuery({
    queryKey: ["dashboard-organization"],
    queryFn: () => getOrganizationWorkspaceRequest(token!),
    enabled: Boolean(token),
  });

  const report = reportQuery.data;
  const organization = organizationQuery.data?.organization;
  const currency = report?.overview.currency ?? "DOP";
  const monthData = report?.spendingByMonth ?? [];
  const categoryData = report?.spendingByCategory ?? [];
  const statusData = useMemo(
    () =>
      (report?.spendingByStatus ?? [])
        .map((item) => ({ ...item, label: statusLabels[item.status] }))
        .filter((item) => item.count > 0 || item.amount > 0),
    [report?.spendingByStatus],
  );

  const openTickets = organization?.counts.openTickets ?? 0;
  const pendingOrders = statusData
    .filter((item) => item.status === "BORRADOR" || item.status === "ENVIADA")
    .reduce((total, item) => total + item.count, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={organization?.name ?? user?.company ?? "Smart Source"}
        title="Centro de control"
        description="Vista rápida de compras, suplidores, tickets y accesos frecuentes."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => navigate("/reports")}>
              <TrendingUp className="h-3.5 w-3.5" />
              Reportes
            </Button>
            <Button type="button" onClick={() => navigate("/registration")}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo suplidor
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Gasto total"
          value={formatMoney(report?.overview.totalSpend ?? 0, currency)}
          detail="Compras registradas"
          icon={TrendingUp}
        />
        <MetricCard
          label="Órdenes"
          value={(report?.overview.orders ?? organization?.counts.orders ?? 0).toString()}
          detail={`${pendingOrders} pendientes`}
          icon={ReceiptText}
        />
        <MetricCard
          label="Suplidores"
          value={(report?.overview.suppliers ?? organization?.counts.suppliers ?? 0).toString()}
          detail="Activos en workspace"
          icon={Building2}
        />
        <MetricCard
          label="Catálogo"
          value={(report?.overview.items ?? organization?.counts.items ?? 0).toString()}
          detail="Items disponibles"
          icon={PackageSearch}
        />
        <MetricCard
          label="Soporte"
          value={openTickets.toString()}
          detail="Tickets abiertos"
          icon={Headphones}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group rounded-lg border border-border bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <action.icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-brand-700" />
            </div>
            <h2 className="mt-3 text-sm font-bold text-ink">{action.title}</h2>
            <p className="mt-1 text-[11px] text-slate-500">{action.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Compras</p>
              <h2 className="text-sm font-bold text-ink">Gasto por mes</h2>
            </div>
            <Badge tone="slate">{monthData.length} meses</Badge>
          </CardHeader>
          <CardContent>
            {reportQuery.isLoading ? (
              <EmptyState text="Cargando gráfica..." />
            ) : monthData.length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={74} />
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                    <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Todavía no hay compras para graficar." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Órdenes</p>
              <h2 className="text-sm font-bold text-ink">Estado actual</h2>
            </div>
            <Badge tone={openTickets ? "amber" : "green"}>{openTickets ? "Atención" : "Normal"}</Badge>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <div className="grid gap-3 sm:grid-cols-[180px_1fr] xl:grid-cols-1">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={42} outerRadius={68} paddingAngle={3}>
                        {statusData.map((item, index) => (
                          <Cell key={item.key} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value)} órdenes`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {statusData.map((item, index) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: chartColors[index % chartColors.length] }}
                        />
                        <span className="truncate text-xs font-semibold text-slate-600">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-ink">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="No hay órdenes con estado para mostrar." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold text-ink">Gasto por categoría</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryData.slice(0, 5).map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">{row.category}</p>
                  <p className="text-[11px] text-slate-500">{row.count} movimientos</p>
                </div>
                <p className="shrink-0 text-xs font-bold text-ink">{formatMoney(row.amount, currency)}</p>
              </div>
            ))}
            {!categoryData.length ? <EmptyState text="Las categorías aparecerán cuando existan compras." /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Órdenes recientes</h2>
            <Link to="/purchase-history" className="text-xs font-bold text-brand-700 hover:text-brand-800">
              Ver historial
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(report?.recentOrders ?? []).slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="grid gap-2 rounded-lg border border-border p-2.5 md:grid-cols-[110px_1fr_95px_120px] md:items-center"
              >
                <p className="text-xs font-bold text-ink">{order.number}</p>
                <p className="truncate text-xs font-semibold text-slate-600">{order.supplierName}</p>
                <Badge tone="slate">{statusLabels[order.status]}</Badge>
                <p className="text-xs font-bold text-ink md:text-right">{formatMoney(Number(order.total), order.currency)}</p>
              </div>
            ))}
            {!report?.recentOrders.length ? <EmptyState text="No hay órdenes recientes." /> : null}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-500">{label}</p>
          <Icon className="h-4 w-4 text-brand-700" />
        </div>
        <p className="mt-2 truncate text-xl font-bold text-ink">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">{text}</p>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { Building2, Download, PackageSearch, ReceiptText, TrendingUp, Upload } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { getReportsSummaryRequest, type PurchaseOrderStatus } from "../services/api";

const chartColors = ["#0F172A", "#10B981", "#38BDF8", "#F59E0B", "#64748B", "#94A3B8"];

const statusLabels: Record<PurchaseOrderStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

export function Reports() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const reportQuery = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => getReportsSummaryRequest(token!),
    enabled: Boolean(token),
  });

  const report = reportQuery.data;
  const currency = report?.overview.currency ?? "DOP";
  const categoryData = report?.spendingByCategory ?? [];
  const supplierData = report?.spendingBySupplier ?? [];
  const monthData = report?.spendingByMonth ?? [];
  const statusData = useMemo(
    () => (report?.spendingByStatus ?? []).map((item) => ({ ...item, label: statusLabels[item.status] })),
    [report?.spendingByStatus],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 7"
        title="Reportes"
        description="Resumen ejecutivo de compras, gasto por suplidor, categoría, mes y estado."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => navigate("/ai-consult")}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gasto total" value={formatMoney(report?.overview.totalSpend ?? 0, currency)} icon={TrendingUp} />
        <MetricCard label="Órdenes" value={(report?.overview.orders ?? 0).toString()} icon={ReceiptText} />
        <MetricCard label="Suplidores" value={(report?.overview.suppliers ?? 0).toString()} icon={Building2} />
        <MetricCard label="Items" value={(report?.overview.items ?? 0).toString()} icon={PackageSearch} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Gasto por mes</h2>
          </CardHeader>
          <CardContent>
            {monthData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={80} />
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                    <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Aún no hay compras para graficar." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Distribución por estado</h2>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="amount" nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={3}>
                      {statusData.map((item, index) => (
                        <Cell key={item.key} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="No hay estados para mostrar." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RankingCard title="Top suplidores" rows={supplierData.map((row) => ({ label: row.supplierName, amount: row.amount, count: row.count }))} currency={currency} />
        <RankingCard title="Gasto por categoría" rows={categoryData.map((row) => ({ label: row.category, amount: row.amount, count: row.count }))} currency={currency} />
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Órdenes recientes</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {(report?.recentOrders ?? []).map((order) => (
            <div key={order.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[140px_1fr_110px_150px] md:items-center">
              <p className="text-[13px] font-bold text-ink">{order.number}</p>
              <p className="text-[13px] font-semibold text-slate-600">{order.supplierName}</p>
              <Badge tone="slate">{statusLabels[order.status]}</Badge>
              <p className="text-sm font-bold text-ink md:text-right">{formatMoney(Number(order.total), order.currency)}</p>
            </div>
          ))}
          {!report?.recentOrders.length ? <EmptyState text="No hay órdenes recientes." /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RankingCard({ title, rows, currency }: { title: string; rows: Array<{ label: string; amount: number; count: number }>; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-bold text-ink">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{row.label}</p>
                <p className="mt-1 text-xs text-slate-500">{row.count} movimientos</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-bold text-ink">{formatMoney(row.amount, currency)}</p>
          </div>
        ))}
        {!rows.length ? <EmptyState text="Sin datos para este reporte." /> : null}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof TrendingUp }) {
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

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">{text}</p>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

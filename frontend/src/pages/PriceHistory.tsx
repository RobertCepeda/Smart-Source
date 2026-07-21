import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3, LineChart as LineChartIcon, RotateCcw } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { getPriceHistoryRequest, type PricePoint } from "../services/api";

export function PriceHistory() {
  const { token } = useAuth();
  const [itemId, setItemId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const priceQuery = useQuery({
    queryKey: ["price-history", itemId, supplierId],
    queryFn: () => getPriceHistoryRequest(token!, { itemId: itemId || undefined, supplierId: supplierId || undefined }),
    enabled: Boolean(token),
  });

  const data = priceQuery.data;
  const items = data?.items ?? [];
  const suppliers = data?.suppliers ?? [];
  const points = useMemo(() => data?.points ?? [], [data?.points]);
  const latestBySupplier = useMemo(() => data?.latestBySupplier ?? [], [data?.latestBySupplier]);
  const selectedItem = items.find((item) => item.id === itemId) ?? items[0] ?? null;
  const currency = points[0]?.currency ?? latestBySupplier[0]?.currency ?? "DOP";

  useEffect(() => {
    if (!itemId && data?.selectedItemId) {
      setItemId(data.selectedItemId);
    }
  }, [data?.selectedItemId, itemId]);

  const lineData = useMemo(
    () =>
      points.map((point) => ({
        date: formatShortDate(point.recordedAt),
        price: point.price,
        supplier: point.supplierName,
        source: point.source,
      })),
    [points],
  );

  const barData = useMemo(
    () =>
      latestBySupplier.map((point) => ({
        supplier: point.supplierName,
        price: point.price,
        source: point.source,
      })),
    [latestBySupplier],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 6"
        title="Historial de precios"
        description="Analiza variaciones, compara suplidores y revisa de donde viene cada precio."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
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
          <Button type="button" variant="outline" onClick={() => setSupplierId("")}>
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registros" value={(data?.summary.count ?? 0).toString()} icon={Activity} />
        <MetricCard label="Mínimo" value={formatMoney(data?.summary.min ?? 0, currency)} icon={LineChartIcon} />
        <MetricCard label="Promedio" value={formatMoney(data?.summary.average ?? 0, currency)} icon={BarChart3} />
        <MetricCard label="Variación" value={`${(data?.summary.variationPercent ?? 0).toFixed(1)}%`} icon={Activity} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Evolución</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedItem?.name ?? "Selecciona un item"}</p>
            </div>
            <Badge tone="slate">{points.length}</Badge>
          </CardHeader>
          <CardContent>
            {priceQuery.isLoading ? (
              <EmptyState text="Cargando precios..." />
            ) : lineData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={72} />
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                    <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="No hay precios registrados para este filtro." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Comparativa por suplidor</h2>
          </CardHeader>
          <CardContent>
            {barData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="supplier" tick={{ fontSize: 12 }} width={115} />
                    <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                    <Bar dataKey="price" fill="#0F172A" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="No hay suplidores con precio para este item." />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Últimos precios</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestBySupplier.map((point) => (
            <PriceRow key={point.id} point={point} />
          ))}
          {!latestBySupplier.length ? <EmptyState text="No hay precios disponibles." /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function PriceRow({ point }: { point: PricePoint }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_150px_120px_160px] md:items-center">
      <div>
        <p className="text-[13px] font-bold text-ink">{point.supplierName}</p>
        <p className="mt-1 text-xs text-slate-500">{point.itemName}</p>
      </div>
      <p className="text-sm font-bold text-ink">{formatMoney(point.price, point.currency)}</p>
      <Badge tone="blue">{point.source}</Badge>
      <p className="text-xs text-slate-500">{formatDate(point.recordedAt)}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", { month: "short", day: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

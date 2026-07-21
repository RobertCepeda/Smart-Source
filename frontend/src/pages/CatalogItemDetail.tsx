import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  MapPin,
  PackageSearch,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import {
  getCatalogItemDetailRequest,
  type CatalogItemPurchase,
  type CatalogItemDetailSupplier,
  type CatalogItemPriceRecord,
  type PurchaseOrderStatus,
} from "../services/api";

const statusLabels: Record<PurchaseOrderStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

const statusTone: Record<PurchaseOrderStatus, "slate" | "green" | "amber" | "blue"> = {
  BORRADOR: "slate",
  ENVIADA: "blue",
  RECIBIDA: "green",
  CANCELADA: "amber",
};

export function CatalogItemDetail() {
  const { token } = useAuth();
  const { id } = useParams();

  const itemQuery = useQuery({
    queryKey: ["catalog-item-detail", id],
    queryFn: () => getCatalogItemDetailRequest(token!, id!),
    enabled: Boolean(token && id),
  });

  const detail = itemQuery.data;
  const item = detail?.item;
  const currency = detail?.purchases[0]?.currency ?? detail?.suppliers[0]?.currency ?? "DOP";
  const lastPurchase = detail?.summary.lastPurchaseAt ? formatDate(detail.summary.lastPurchaseAt) : "Sin compras";
  const cheapestSupplier = useMemo(() => {
    const withPrice = (detail?.suppliers ?? []).filter((supplier) => supplier.lastPrice);
    return withPrice.sort((a, b) => Number(a.lastPrice) - Number(b.lastPrice))[0] ?? null;
  }, [detail?.suppliers]);

  if (itemQuery.isLoading) {
    return <EmptyState text="Cargando registro del producto..." />;
  }

  if (itemQuery.isError || !detail || !item) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <EmptyState text="No pudimos cargar este producto." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Registro del producto"
        title={item.name}
        description={compact([item.category?.name, item.brand?.name, item.unit, item.type]).join(" · ") || "Ficha del catálogo"}
        actions={
          <Link to="/catalog">
            <Button type="button" variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Catálogo
            </Button>
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Compras" value={detail.summary.purchaseCount.toString()} icon={ReceiptText} />
        <MetricCard label="Suplidores" value={detail.summary.supplierCount.toString()} icon={Building2} />
        <MetricCard label="Cantidad" value={formatNumber(detail.summary.totalQuantity)} icon={PackageSearch} />
        <MetricCard label="Gasto total" value={formatMoney(detail.summary.totalSpend, currency)} icon={TrendingUp} />
        <MetricCard label="Última compra" value={lastPurchase} icon={CalendarDays} compact />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold text-ink">Ficha del producto</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nombre" value={item.name} />
            <InfoRow label="Tipo" value={item.type === "MATERIAL" ? "Material" : "Servicio"} />
            <InfoRow label="Categoría" value={item.category?.name ?? "Sin categoría"} />
            <InfoRow label="Marca" value={item.brand?.name ?? "Sin marca"} />
            <InfoRow label="Unidad" value={item.unit ?? "Sin unidad"} />
            <InfoRow label="Descripción" value={item.description ?? "Sin descripción"} />
            {cheapestSupplier ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-800">
                <p className="text-xs font-bold uppercase tracking-[0.12em]">Mejor precio actual</p>
                <p className="mt-1 text-sm font-bold">
                  {formatMoney(Number(cheapestSupplier.lastPrice), cheapestSupplier.currency)} · {cheapestSupplier.supplier.name}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Compras registradas</h2>
            <Badge tone="slate">{detail.purchases.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {detail.purchases.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-xs">
                  <thead className="border-b border-border bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Orden</th>
                      <th className="px-3 py-2">Suplidor</th>
                      <th className="px-3 py-2">Ubicación</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.purchases.map((purchase) => (
                      <PurchaseRow key={purchase.id} purchase={purchase} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState text="Este producto todavía no aparece en órdenes de compra." />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Suplidores relacionados</h2>
            <Badge tone="slate">{detail.suppliers.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.suppliers.map((supplier) => (
              <SupplierRow key={supplier.supplierId} supplier={supplier} />
            ))}
            {!detail.suppliers.length ? <EmptyState text="Aún no hay suplidores relacionados con este producto." /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Movimientos de precio</h2>
            <Badge tone="slate">{detail.priceHistory.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.priceHistory.slice(0, 10).map((record) => (
              <PriceRecordRow key={record.id} record={record} />
            ))}
            {!detail.priceHistory.length ? <EmptyState text="No hay movimientos de precio para este producto." /> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function PurchaseRow({ purchase }: { purchase: CatalogItemPurchase }) {
  const location = compact([purchase.supplier.city, purchase.supplier.address]).join(" · ") || "Sin ubicación";

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-600">{formatDate(purchase.issueDate)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">{purchase.orderNumber}</span>
          <Badge tone={statusTone[purchase.status]}>{statusLabels[purchase.status]}</Badge>
        </div>
      </td>
      <td className="px-3 py-2">
        <Link className="font-semibold text-brand-700 hover:text-brand-800" to={`/suppliers/${purchase.supplier.id}`}>
          {purchase.supplier.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-slate-500">{compact([purchase.supplier.rnc, purchase.supplier.category]).join(" · ")}</p>
      </td>
      <td className="px-3 py-2 text-slate-600">
        <span className="inline-flex max-w-[240px] items-start gap-1">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{location}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-right text-slate-600">{formatNumber(Number(purchase.quantity))}</td>
      <td className="px-3 py-2 text-right text-slate-600">{formatMoney(Number(purchase.unitPrice), purchase.currency)}</td>
      <td className="px-3 py-2 text-right font-bold text-ink">{formatMoney(Number(purchase.lineTotal), purchase.currency)}</td>
    </tr>
  );
}

function SupplierRow({ supplier }: { supplier: CatalogItemDetailSupplier }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link className="font-bold text-ink hover:text-brand-700" to={`/suppliers/${supplier.supplier.id}`}>
            {supplier.supplier.name}
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            {compact([supplier.supplier.city, supplier.supplier.address, supplier.supplier.category]).join(" · ") || "Sin ubicación"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {compact([supplier.supplier.phone, supplier.supplier.email]).join(" · ") || "Sin contacto"}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-sm font-bold text-ink">
            {supplier.lastPrice ? formatMoney(Number(supplier.lastPrice), supplier.currency) : "Sin precio"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {supplier.leadTimeDays ? `${supplier.leadTimeDays} días entrega` : "Entrega no definida"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PriceRecordRow({ record }: { record: CatalogItemPriceRecord }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">{record.supplierName}</p>
        <p className="mt-1 text-xs text-slate-500">
          {compact([record.supplierCity, record.supplierAddress, record.source]).join(" · ")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-ink">{formatMoney(Number(record.price), record.currency)}</p>
        <p className="mt-1 text-[11px] text-slate-500">{formatDate(record.recordedAt)}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  compact: isCompact = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-500">{label}</p>
          <Icon className="h-4 w-4 text-brand-700" />
        </div>
        <p className={isCompact ? "mt-2 truncate text-sm font-bold text-ink" : "mt-2 truncate text-xl font-bold text-ink"}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{text}</p>;
}

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

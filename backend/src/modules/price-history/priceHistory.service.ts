import { prisma } from "../../lib/prisma";
import type { priceHistoryQuerySchema } from "./priceHistory.schema";
import type { z } from "zod";

type PriceHistoryQuery = z.infer<typeof priceHistoryQuerySchema>;

type PricePoint = {
  id: string;
  itemId: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  price: number;
  currency: string;
  recordedAt: Date;
  source: string;
};

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function serializePoint(point: PricePoint) {
  return {
    ...point,
    price: Number(point.price.toFixed(2)),
    recordedAt: point.recordedAt,
  };
}

function uniquePoints(points: PricePoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = [
      point.itemId,
      point.supplierId,
      point.price.toFixed(2),
      point.recordedAt.toISOString().slice(0, 10),
      point.source,
    ].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function getPriceHistory(organizationId: string, query: PriceHistoryQuery) {
  const itemId = cleanString(query.itemId);
  const supplierId = cleanString(query.supplierId);

  const [items, suppliers, manualHistory, supplierItems, orderLines] = await Promise.all([
    prisma.item.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        unit: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, category: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.priceHistory.findMany({
      where: {
        item: { organizationId, isActive: true },
        supplier: { organizationId, isActive: true },
        ...(itemId ? { itemId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: {
        item: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { recordedAt: "asc" },
    }),
    prisma.supplierItem.findMany({
      where: {
        supplier: { organizationId, isActive: true },
        item: { organizationId, isActive: true },
        lastPrice: { not: null },
        ...(itemId ? { itemId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: {
        item: { select: { name: true } },
        supplier: { select: { name: true, updatedAt: true } },
      },
    }),
    prisma.purchaseOrderLine.findMany({
      where: {
        order: {
          supplier: { organizationId, isActive: true },
          ...(supplierId ? { supplierId } : {}),
        },
        item: { organizationId, isActive: true, ...(itemId ? { id: itemId } : {}) },
      },
      include: {
        item: { select: { id: true, name: true } },
        order: {
          select: {
            number: true,
            issueDate: true,
            currency: true,
            supplierId: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { order: { issueDate: "asc" } },
    }),
  ]);

  const points = uniquePoints([
    ...manualHistory.map((row): PricePoint => ({
      id: row.id,
      itemId: row.itemId,
      itemName: row.item.name,
      supplierId: row.supplierId,
      supplierName: row.supplier.name,
      price: Number(row.price),
      currency: row.currency,
      recordedAt: row.recordedAt,
      source: row.source || "Registro manual",
    })),
    ...supplierItems.map((row): PricePoint => ({
      id: `${row.supplierId}-${row.itemId}-current`,
      itemId: row.itemId,
      itemName: row.item.name,
      supplierId: row.supplierId,
      supplierName: row.supplier.name,
      price: Number(row.lastPrice),
      currency: row.currency,
      recordedAt: row.supplier.updatedAt,
      source: "Precio actual",
    })),
    ...orderLines.map((row): PricePoint => ({
      id: `${row.order.number}-${row.itemId}`,
      itemId: row.itemId,
      itemName: row.item.name,
      supplierId: row.order.supplierId,
      supplierName: row.order.supplier.name,
      price: Number(row.unitPrice),
      currency: row.order.currency,
      recordedAt: row.order.issueDate,
      source: `Orden ${row.order.number}`,
    })),
  ]).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  const latestBySupplier = Array.from(
    points
      .reduce((map, point) => {
        const current = map.get(point.supplierId);
        if (!current || point.recordedAt > current.recordedAt) {
          map.set(point.supplierId, point);
        }
        return map;
      }, new Map<string, PricePoint>())
      .values(),
  ).sort((a, b) => a.price - b.price);

  const prices = points.map((point) => point.price);
  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;

  return {
    items,
    suppliers,
    selectedItemId: itemId ?? items[0]?.id ?? null,
    selectedSupplierId: supplierId ?? null,
    points: points.map(serializePoint),
    latestBySupplier: latestBySupplier.map(serializePoint),
    summary: {
      count: points.length,
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      average: average(prices),
      variationPercent: first ? ((last - first) / first) * 100 : 0,
    },
  };
}

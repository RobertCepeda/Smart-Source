import { prisma } from "../../lib/prisma";
import type { createItemSchema, createNamedEntitySchema, listItemsQuerySchema, updateItemSchema } from "./catalog.schema";
import type { z } from "zod";

type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;
type NamedEntityInput = z.infer<typeof createNamedEntitySchema>;

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function mapItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    unit: item.unit,
    description: item.description,
    categoryId: item.categoryId,
    brandId: item.brandId,
    category: item.category,
    brand: item.brand,
    supplierCount: item.suppliers?.length ?? 0,
  };
}

async function ensureItem(organizationId: string, id: string) {
  const item = await prisma.item.findFirst({
    where: { id, organizationId, isActive: true },
    include: {
      category: true,
      brand: true,
      suppliers: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              rnc: true,
              city: true,
              address: true,
              category: true,
              phone: true,
              email: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    const error = new Error("Item no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return item;
}

function supplierSummary(supplier: any) {
  return {
    id: supplier.id,
    name: supplier.name,
    rnc: supplier.rnc,
    city: supplier.city,
    address: supplier.address,
    category: supplier.category,
    phone: supplier.phone,
    email: supplier.email,
  };
}

function summarizePurchases(lines: any[]) {
  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  const totalSpend = lines.reduce((sum, line) => sum + Number(line.lineTotal), 0);

  return {
    purchaseCount: lines.length,
    supplierCount: new Set(lines.map((line) => line.order.supplierId)).size,
    totalQuantity: Number(totalQuantity.toFixed(2)),
    totalSpend: Number(totalSpend.toFixed(2)),
    averageUnitPrice: totalQuantity ? Number((totalSpend / totalQuantity).toFixed(2)) : 0,
    lastPurchaseAt: lines[0]?.order.issueDate ?? null,
  };
}

export async function listItems(organizationId: string, query: ListItemsQuery) {
  const search = cleanString(query.search);

  const items = await prisma.item.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(query.type ? { type: query.type } : {}),
      ...(cleanString(query.categoryId) ? { categoryId: query.categoryId } : {}),
      ...(cleanString(query.brandId) ? { brandId: query.brandId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { category: { name: { contains: search, mode: "insensitive" as const } } },
              { brand: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: { category: true, brand: true, suppliers: true },
    orderBy: { name: "asc" },
  });

  return items.map(mapItem);
}

export async function getItemDetail(organizationId: string, id: string) {
  const item = await ensureItem(organizationId, id);

  const [purchaseLines, priceHistory] = await Promise.all([
    prisma.purchaseOrderLine.findMany({
      where: {
        itemId: id,
        order: {
          supplier: { organizationId, isActive: true },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            status: true,
            issueDate: true,
            currency: true,
            total: true,
            supplierId: true,
            supplier: {
              select: {
                id: true,
                name: true,
                rnc: true,
                city: true,
                address: true,
                category: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { order: { issueDate: "desc" } },
    }),
    prisma.priceHistory.findMany({
      where: {
        itemId: id,
        supplier: { organizationId, isActive: true },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            category: true,
          },
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 30,
    }),
  ]);

  const suppliers = item.suppliers
    .filter((link: any) => link.supplier?.isActive)
    .map((link: any) => ({
      supplierId: link.supplierId,
      itemId: link.itemId,
      lastPrice: link.lastPrice?.toString() ?? null,
      currency: link.currency,
      leadTimeDays: link.leadTimeDays,
      supplier: supplierSummary(link.supplier),
    }));

  const purchases = purchaseLines.map((line) => ({
    id: line.id,
    orderId: line.orderId,
    orderNumber: line.order.number,
    status: line.order.status,
    issueDate: line.order.issueDate,
    currency: line.order.currency,
    quantity: line.quantity.toString(),
    unitPrice: line.unitPrice.toString(),
    lineTotal: line.lineTotal.toString(),
    orderTotal: line.order.total.toString(),
    supplier: supplierSummary(line.order.supplier),
  }));

  return {
    item: mapItem(item),
    suppliers,
    purchases,
    priceHistory: priceHistory.map((point) => ({
      id: point.id,
      supplierId: point.supplierId,
      supplierName: point.supplier.name,
      supplierCity: point.supplier.city,
      supplierAddress: point.supplier.address,
      supplierCategory: point.supplier.category,
      price: point.price.toString(),
      currency: point.currency,
      recordedAt: point.recordedAt,
      source: point.source ?? "Registro manual",
    })),
    summary: summarizePurchases(purchaseLines),
  };
}

export async function createItem(organizationId: string, input: CreateItemInput) {
  const item = await prisma.item.create({
    data: {
      organizationId,
      name: input.name.trim(),
      type: input.type,
      unit: cleanString(input.unit),
      categoryId: cleanString(input.categoryId),
      brandId: cleanString(input.brandId),
      description: cleanString(input.description),
    },
    include: { category: true, brand: true, suppliers: true },
  });

  return mapItem(item);
}

export async function updateItem(organizationId: string, id: string, input: UpdateItemInput) {
  await ensureItem(organizationId, id);

  const item = await prisma.item.update({
    where: { id },
    data: {
      name: cleanString(input.name),
      type: input.type,
      unit: cleanString(input.unit),
      categoryId: cleanString(input.categoryId),
      brandId: cleanString(input.brandId),
      description: cleanString(input.description),
    },
    include: { category: true, brand: true, suppliers: true },
  });

  return mapItem(item);
}

export async function deactivateItem(organizationId: string, id: string) {
  await ensureItem(organizationId, id);
  await prisma.item.update({ where: { id }, data: { isActive: false } });
}

export async function listCategories(organizationId: string) {
  return prisma.category.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(organizationId: string, input: NamedEntityInput) {
  return prisma.category.upsert({
    where: { organizationId_name: { organizationId, name: input.name.trim() } },
    update: {},
    create: { organizationId, name: input.name.trim() },
  });
}

export async function listBrands(organizationId: string) {
  return prisma.brand.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createBrand(organizationId: string, input: NamedEntityInput) {
  return prisma.brand.upsert({
    where: { organizationId_name: { organizationId, name: input.name.trim() } },
    update: {},
    create: { organizationId, name: input.name.trim() },
  });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

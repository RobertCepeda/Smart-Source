import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../lib/audit";
import type { createItemSchema, createNamedEntitySchema, createSubcategorySchema, createUnitSchema, listItemsQuerySchema, listSubcategoriesQuerySchema, updateItemSchema } from "./catalog.schema";
import type { z } from "zod";

type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;
type NamedEntityInput = z.infer<typeof createNamedEntitySchema>;
type CreateUnitInput = z.infer<typeof createUnitSchema>;
type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
type ListSubcategoriesQuery = z.infer<typeof listSubcategoriesQuerySchema>;

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function upperString(value?: string | null) {
  return cleanString(value)?.toLocaleUpperCase("es");
}

function normalizeUnit(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function ensureUnit(organizationId: string, name?: string | null, abbreviation?: string | null) {
  const unitName = cleanString(name);
  if (!unitName) {
    return null;
  }

  return prisma.unitOfMeasure.upsert({
    where: { organizationId_name: { organizationId, name: normalizeUnit(unitName) } },
    update: {
      abbreviation: cleanString(abbreviation),
      isActive: true,
    },
    create: {
      organizationId,
      name: normalizeUnit(unitName),
      abbreviation: cleanString(abbreviation),
    },
  });
}

async function validateSubcategory(organizationId: string, categoryId?: string | null, subcategoryId?: string | null) {
  if (!subcategoryId) {
    return;
  }

  const validSubcategory = await prisma.subcategory.findFirst({
    where: {
      id: subcategoryId,
      organizationId,
      ...(categoryId ? { categoryId } : {}),
    },
  });

  if (!validSubcategory) {
    const error = new Error("La subcategoría no pertenece a la categoría seleccionada.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
}

function mapItem(item: any) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    unit: item.unit,
    description: item.description,
    categoryId: item.categoryId,
    subcategoryId: item.subcategoryId,
    brandId: item.brandId,
    category: item.category,
    subcategory: item.subcategory,
    brand: item.brand,
    supplierCount: item.suppliers?.length ?? 0,
  };
}

async function ensureItem(organizationId: string, id: string) {
  const item = await prisma.item.findFirst({
    where: { id, organizationId, isActive: true },
    include: {
      category: true,
      subcategory: true,
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
      ...(cleanString(query.subcategoryId) ? { subcategoryId: query.subcategoryId } : {}),
      ...(cleanString(query.brandId) ? { brandId: query.brandId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { category: { name: { contains: search, mode: "insensitive" as const } } },
              { subcategory: { name: { contains: search, mode: "insensitive" as const } } },
              { brand: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: { category: true, subcategory: true, brand: true, suppliers: true },
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

export async function createItem(organizationId: string, actorId: string, input: CreateItemInput) {
  await ensureUnit(organizationId, input.unit);
  await validateSubcategory(organizationId, input.categoryId, input.subcategoryId);

  const item = await prisma.item.create({
    data: {
      organizationId,
      name: upperString(input.name)!,
      type: input.type,
      unit: cleanString(input.unit),
      categoryId: cleanString(input.categoryId),
      subcategoryId: cleanString(input.subcategoryId),
      brandId: cleanString(input.brandId),
      description: upperString(input.description),
    },
    include: { category: true, subcategory: true, brand: true, suppliers: true },
  });

  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "ITEM", entityId: item.id, summary: `Creó el ítem ${item.name}`, after: item });

  return mapItem(item);
}

export async function updateItem(organizationId: string, actorId: string, id: string, input: UpdateItemInput) {
  const previous = await ensureItem(organizationId, id);
  await ensureUnit(organizationId, input.unit);
  await validateSubcategory(
    organizationId,
    input.categoryId === undefined ? previous.categoryId : input.categoryId,
    input.subcategoryId === undefined ? previous.subcategoryId : input.subcategoryId,
  );

  const item = await prisma.item.update({
    where: { id },
    data: {
      name: upperString(input.name),
      type: input.type,
      unit: cleanString(input.unit),
      categoryId: cleanString(input.categoryId),
      subcategoryId: cleanString(input.subcategoryId),
      brandId: cleanString(input.brandId),
      description: upperString(input.description),
    },
    include: { category: true, subcategory: true, brand: true, suppliers: true },
  });

  await recordAudit({ organizationId, userId: actorId, action: "UPDATE", entityType: "ITEM", entityId: id, summary: `Actualizó el ítem ${item.name}`, before: previous, after: item });

  return mapItem(item);
}

export async function deactivateItem(organizationId: string, actorId: string, id: string) {
  const previous = await ensureItem(organizationId, id);
  await prisma.item.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  await recordAudit({ organizationId, userId: actorId, action: "DELETE", entityType: "ITEM", entityId: id, summary: `Eliminó el ítem ${previous.name}`, before: previous, metadata: { restorable: true } });
}

export async function restoreItem(organizationId: string, actorId: string, id: string) {
  const item = await prisma.item.findFirst({ where: { id, organizationId, isActive: false } });
  if (!item) {
    const error = new Error("No se encontró un ítem eliminado para restaurar.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  const restored = await prisma.item.update({ where: { id }, data: { isActive: true, deletedAt: null } });
  await recordAudit({ organizationId, userId: actorId, action: "RESTORE", entityType: "ITEM", entityId: id, summary: `Restauró el ítem ${restored.name}`, after: restored });
}

export async function listCategories(organizationId: string) {
  return prisma.category.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(organizationId: string, actorId: string, input: NamedEntityInput) {
  const name = upperString(input.name)!;
  const category = await prisma.category.upsert({
    where: { organizationId_name: { organizationId, name } },
    update: {},
    create: { organizationId, name },
  });
  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "CATEGORY", entityId: category.id, summary: `Registró la categoría ${category.name}`, after: category });
  return category;
}

export async function listSubcategories(organizationId: string, query: ListSubcategoriesQuery) {
  return prisma.subcategory.findMany({
    where: { organizationId, ...(query.categoryId ? { categoryId: query.categoryId } : {}) },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
}

export async function createSubcategory(organizationId: string, actorId: string, input: CreateSubcategoryInput) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, organizationId } });
  if (!category) {
    const error = new Error("Selecciona una categoría válida.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const name = upperString(input.name)!;
  const subcategory = await prisma.subcategory.upsert({
    where: { organizationId_categoryId_name: { organizationId, categoryId: input.categoryId, name } },
    update: {},
    create: { organizationId, categoryId: input.categoryId, name },
    include: { category: { select: { id: true, name: true } } },
  });
  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "SUBCATEGORY", entityId: subcategory.id, summary: `Creó la subcategoría ${subcategory.name}`, after: subcategory });
  return subcategory;
}

export async function listBrands(organizationId: string) {
  return prisma.brand.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createBrand(organizationId: string, actorId: string, input: NamedEntityInput) {
  const name = upperString(input.name)!;
  const brand = await prisma.brand.upsert({
    where: { organizationId_name: { organizationId, name } },
    update: {},
    create: { organizationId, name },
  });
  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "BRAND", entityId: brand.id, summary: `Registró la marca ${brand.name}`, after: brand });
  return brand;
}

export async function listUnits(organizationId: string) {
  const [units, itemUnits, requestItemUnits] = await Promise.all([
    prisma.unitOfMeasure.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { organizationId, isActive: true, unit: { not: null } },
      select: { unit: true },
      distinct: ["unit"],
    }),
    prisma.quoteRequestItem.findMany({
      where: { quoteRequest: { organizationId } },
      select: { unit: true },
      distinct: ["unit"],
    }),
  ]);

  const knownNames = new Set(units.map((unit) => normalizeUnit(unit.name)));
  const inferredUnits = [...itemUnits, ...requestItemUnits]
    .map((entry) => cleanString(entry.unit))
    .filter((unit): unit is string => Boolean(unit))
    .filter((unit) => !knownNames.has(normalizeUnit(unit)))
    .map((unit) => ({
      id: `inferred_${normalizeUnit(unit).replace(/[^a-z0-9]+/g, "_")}`,
      organizationId,
      name: normalizeUnit(unit),
      abbreviation: null,
      isActive: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));

  return [...units, ...inferredUnits].sort((left, right) => left.name.localeCompare(right.name, "es"));
}

export async function createUnit(organizationId: string, actorId: string, input: CreateUnitInput) {
  const unit = await ensureUnit(organizationId, input.name, input.abbreviation);
  if (unit) {
    await recordAudit({
      organizationId,
      userId: actorId,
      action: "CREATE",
      entityType: "UNIT",
      entityId: unit.id,
      summary: `Registró la unidad ${unit.name}`,
      after: unit,
    });
  }
  return unit;
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

import { prisma } from "../../lib/prisma";
import type {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  updateOrderStatusSchema,
} from "./purchaseOrder.schema";
import type { z } from "zod";

type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

const orderInclude = {
  supplier: {
    select: {
      id: true,
      name: true,
      rnc: true,
      city: true,
      category: true,
      email: true,
      phone: true,
      organizationId: true,
    },
  },
  lines: {
    include: {
      item: {
        select: {
          id: true,
          name: true,
          type: true,
          unit: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

function decimalString(value: number) {
  return money(value).toFixed(2);
}

function mapOrder(order: any) {
  return {
    id: order.id,
    number: order.number,
    supplierId: order.supplierId,
    status: order.status,
    issueDate: order.issueDate,
    currency: order.currency,
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    total: order.total.toString(),
    notes: order.notes,
    supplier: order.supplier,
    lines: order.lines.map((line: any) => ({
      id: line.id,
      itemId: line.itemId,
      quantity: line.quantity.toString(),
      unitPrice: line.unitPrice.toString(),
      lineTotal: line.lineTotal.toString(),
      item: line.item,
    })),
  };
}

async function ensureSupplier(organizationId: string, supplierId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, isActive: true },
    select: { id: true },
  });

  if (!supplier) {
    const error = new Error("Selecciona un suplidor valido.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
}

async function ensureOrder(organizationId: string, id: string) {
  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id,
      supplier: { organizationId },
    },
    include: orderInclude,
  });

  if (!order) {
    const error = new Error("Orden de compra no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return order;
}

async function ensureItems(organizationId: string, itemIds: string[]) {
  const uniqueIds = Array.from(new Set(itemIds));
  const items = await prisma.item.findMany({
    where: {
      id: { in: uniqueIds },
      organizationId,
      isActive: true,
    },
    select: { id: true },
  });

  if (items.length !== uniqueIds.length) {
    const error = new Error("Una o más líneas tienen items no válidos.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
}

async function nextOrderNumber(tx: any, organizationId: string) {
  const year = new Date().getFullYear();
  const baseCount = await tx.purchaseOrder.count({
    where: { supplier: { organizationId } },
  });

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const number = `OC-${year}-${String(baseCount + attempt).padStart(4, "0")}`;
    const existing = await tx.purchaseOrder.findUnique({ where: { number } });

    if (!existing) {
      return number;
    }
  }

  return `OC-${year}-${Date.now()}`;
}

export async function listPurchaseOrders(organizationId: string, query: ListPurchaseOrdersQuery) {
  const search = cleanString(query.search);
  const issueDate =
    query.dateFrom || query.dateTo
      ? {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
        }
      : undefined;

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      supplier: {
        organizationId,
        ...(cleanString(query.supplierId) ? { id: query.supplierId } : {}),
      },
      ...(query.status ? { status: query.status } : {}),
      ...(issueDate ? { issueDate } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" as const } },
              { notes: { contains: search, mode: "insensitive" as const } },
              { supplier: { name: { contains: search, mode: "insensitive" as const } } },
              { supplier: { rnc: { contains: search, mode: "insensitive" as const } } },
              { lines: { some: { item: { name: { contains: search, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
    },
    include: orderInclude,
    orderBy: { issueDate: "desc" },
  });

  return orders.map(mapOrder);
}

export async function getPurchaseOrder(organizationId: string, id: string) {
  return mapOrder(await ensureOrder(organizationId, id));
}

export async function createPurchaseOrder(organizationId: string, input: CreatePurchaseOrderInput) {
  await ensureSupplier(organizationId, input.supplierId);
  await ensureItems(organizationId, input.lines.map((line) => line.itemId));

  const lines = input.lines.map((line) => {
    const lineTotal = money(line.quantity * line.unitPrice);

    return {
      itemId: line.itemId,
      quantity: decimalString(line.quantity),
      unitPrice: decimalString(line.unitPrice),
      lineTotal: decimalString(lineTotal),
      numericLineTotal: lineTotal,
    };
  });

  const subtotal = money(lines.reduce((sum, line) => sum + line.numericLineTotal, 0));
  const tax = money(subtotal * input.taxRate);
  const total = money(subtotal + tax);

  const order = await prisma.$transaction(async (tx) => {
    const number = await nextOrderNumber(tx, organizationId);

    const createdOrder = await tx.purchaseOrder.create({
      data: {
        number,
        supplierId: input.supplierId,
        issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
        currency: input.currency.trim().toUpperCase(),
        subtotal: decimalString(subtotal),
        tax: decimalString(tax),
        total: decimalString(total),
        notes: cleanString(input.notes),
        lines: {
          create: lines.map(({ numericLineTotal: _numericLineTotal, ...line }) => line),
        },
      },
      include: orderInclude,
    });

    await tx.priceHistory.createMany({
      data: lines.map((line) => ({
        itemId: line.itemId,
        supplierId: input.supplierId,
        price: line.unitPrice,
        currency: input.currency.trim().toUpperCase(),
        recordedAt: createdOrder.issueDate,
        source: `Orden ${createdOrder.number}`,
      })),
    });

    return createdOrder;
  });

  return mapOrder(order);
}

export async function updatePurchaseOrderStatus(
  organizationId: string,
  id: string,
  input: UpdateOrderStatusInput,
) {
  await ensureOrder(organizationId, id);

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: input.status },
    include: orderInclude,
  });

  return mapOrder(order);
}

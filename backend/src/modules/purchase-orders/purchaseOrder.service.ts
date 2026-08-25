import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../lib/audit";
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
  warehouse: { select: { id: true, name: true, code: true, type: true, location: true } },
  costCenterRef: { select: { id: true, code: true, name: true, isActive: true } },
  quoteRequest: { select: { id: true, number: true, project: true, costCenter: true, costCenterId: true } },
  receivedBy: { select: { id: true, name: true } },
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
    organizationId: order.organizationId,
    quoteRequestId: order.quoteRequestId,
    warehouseId: order.warehouseId,
    receivedAt: order.receivedAt,
    costCenterId: order.costCenterId,
    costCenter: order.costCenter,
    costCenterRecord: order.costCenterRef,
    status: order.status,
    issueDate: order.issueDate,
    currency: order.currency,
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    total: order.total.toString(),
    notes: order.notes,
    supplier: order.supplier,
    warehouse: order.warehouse,
    quoteRequest: order.quoteRequest,
    receivedBy: order.receivedBy,
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
      organizationId,
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
    where: { organizationId },
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
      organizationId,
      supplier: {
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

export async function createPurchaseOrder(organizationId: string, actorId: string, input: CreatePurchaseOrderInput) {
  await ensureSupplier(organizationId, input.supplierId);
  await ensureItems(organizationId, input.lines.map((line) => line.itemId));

  const quoteRequest = input.quoteRequestId
    ? await prisma.quoteRequest.findFirst({ where: { id: input.quoteRequestId, organizationId } })
    : null;
  if (input.quoteRequestId && !quoteRequest) {
    const error = new Error("La solicitud de cotización no pertenece a tu organización.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const selectedCostCenterId = cleanString(input.costCenterId) ?? quoteRequest?.costCenterId ?? undefined;
  const costCenter = selectedCostCenterId
    ? await prisma.costCenter.findFirst({ where: { id: selectedCostCenterId, organizationId, isActive: true } })
    : null;
  if (selectedCostCenterId && !costCenter) {
    const error = new Error("El centro de costo seleccionado no está disponible.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

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
        organizationId,
        number,
        supplierId: input.supplierId,
        quoteRequestId: input.quoteRequestId,
        costCenterId: costCenter?.id,
        costCenter: costCenter ? `${costCenter.code} - ${costCenter.name}` : cleanString(input.costCenter) ?? quoteRequest?.costCenter ?? undefined,
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

    await recordAudit(
      { organizationId, userId: actorId, action: "CREATE", entityType: "PURCHASE_ORDER", entityId: createdOrder.id, summary: `Creó la orden ${createdOrder.number}`, after: createdOrder },
      tx,
    );

    return createdOrder;
  });

  return mapOrder(order);
}

export async function updatePurchaseOrderStatus(
  organizationId: string,
  actorId: string,
  id: string,
  input: UpdateOrderStatusInput,
) {
  const previous = await ensureOrder(organizationId, id);

  if (input.status === "RECIBIDA") {
    if (previous.status === "RECIBIDA") {
      const error = new Error("Esta orden ya fue recibida y contabilizada en inventario.");
      (error as Error & { status: number }).status = 400;
      throw error;
    }
    const inventoryLines = previous.lines.filter((line) => line.item.type === "MATERIAL");
    if (inventoryLines.length > 0 && !input.warehouseId) {
      const error = new Error("Selecciona el almacén que recibirá los productos.");
      (error as Error & { status: number }).status = 400;
      throw error;
    }
    const warehouse = input.warehouseId
      ? await prisma.warehouse.findFirst({ where: { id: input.warehouseId, organizationId, isActive: true } })
      : null;
    if (inventoryLines.length > 0 && !warehouse) {
      const error = new Error("El almacén seleccionado no es válido.");
      (error as Error & { status: number }).status = 404;
      throw error;
    }

    const received = await prisma.$transaction(async (tx) => {
      for (const line of inventoryLines) {
        await tx.inventoryBalance.upsert({
          where: { warehouseId_itemId: { warehouseId: warehouse!.id, itemId: line.itemId } },
          update: { quantity: { increment: line.quantity } },
          create: { warehouseId: warehouse!.id, itemId: line.itemId, quantity: line.quantity },
        });
        await tx.inventoryMovement.create({
          data: {
            organizationId,
            warehouseId: warehouse!.id,
            itemId: line.itemId,
            orderId: previous.id,
            createdById: actorId,
            type: "ENTRADA",
            quantity: line.quantity,
            unit: line.item.unit,
            reference: previous.number,
            notes: `RECEPCIÓN DE ORDEN ${previous.number}`,
          },
        });
      }
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECIBIDA", warehouseId: warehouse?.id, receivedById: actorId, receivedAt: new Date() },
        include: orderInclude,
      });
      await recordAudit(
        {
          organizationId,
          userId: actorId,
          action: "RECEIVE",
          entityType: "PURCHASE_ORDER",
          entityId: id,
          summary: warehouse
            ? `Recibió la orden ${previous.number} en ${warehouse.name}`
            : `Completó la orden de servicios ${previous.number}`,
          before: { status: previous.status },
          after: { status: "RECIBIDA", warehouseId: warehouse?.id ?? null },
        },
        tx,
      );
      return updated;
    });
    return mapOrder(received);
  }

  if (previous.status === "RECIBIDA") {
    const error = new Error("Una orden recibida no puede cambiar de estado porque ya afectó inventario.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const order = await prisma.purchaseOrder.update({ where: { id }, data: { status: input.status }, include: orderInclude });
  await recordAudit({ organizationId, userId: actorId, action: "STATUS_CHANGE", entityType: "PURCHASE_ORDER", entityId: id, summary: `Cambió ${order.number} a ${input.status}`, before: { status: previous.status }, after: { status: input.status } });
  return mapOrder(order);
}

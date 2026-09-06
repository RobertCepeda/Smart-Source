import { recordAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import type { createWarehouseSchema, inventoryMovementSchema, inventoryTransferSchema } from "./warehouse.schema";
import type { z } from "zod";

type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;

function upper(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toLocaleUpperCase("es") : undefined;
}

function mapWarehouse(warehouse: any) {
  return {
    ...warehouse,
    balances: (warehouse.balances ?? []).map((balance: any) => ({
      ...balance,
      quantity: balance.quantity.toString(),
    })),
    movements: (warehouse.movements ?? []).map((movement: any) => ({
      ...movement,
      quantity: movement.quantity.toString(),
    })),
  };
}

export async function listWarehouses(organizationId: string) {
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId, isActive: true },
    include: {
      balances: {
        where: { quantity: { not: 0 } },
        include: { item: { include: { category: true, subcategory: true, brand: true } } },
        orderBy: { item: { name: "asc" } },
      },
      movements: {
        include: {
          item: { select: { id: true, name: true, unit: true } },
          createdBy: { select: { id: true, name: true } },
          order: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { balances: true, movements: true, purchaseOrders: true } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return warehouses.map(mapWarehouse);
}

export async function createWarehouse(organizationId: string, actorId: string, input: CreateWarehouseInput) {
  const warehouse = await prisma.warehouse.create({
    data: {
      organizationId,
      name: upper(input.name)!,
      code: upper(input.code)!,
      type: input.type,
      location: upper(input.location),
    },
    include: { balances: true, movements: true, _count: { select: { balances: true, movements: true, purchaseOrders: true } } },
  });

  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "WAREHOUSE", entityId: warehouse.id, summary: `Creó el almacén ${warehouse.name}`, after: warehouse });
  return mapWarehouse(warehouse);
}

const transferInclude = {
  originWarehouse: { select: { id: true, name: true, code: true } },
  destinationWarehouse: { select: { id: true, name: true, code: true } },
  item: { select: { id: true, name: true, unit: true } },
  createdBy: { select: { id: true, name: true } },
  driver: { select: { id: true, name: true, email: true } },
  receivedBy: { select: { id: true, name: true } },
};

function mapTransfer(transfer: any) {
  return { ...transfer, quantity: transfer.quantity.toString() };
}

export async function listInventoryTransfers(organizationId: string) {
  const transfers = await prisma.inventoryTransfer.findMany({
    where: { organizationId },
    include: transferInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return transfers.map(mapTransfer);
}

export async function createInventoryTransfer(
  organizationId: string,
  actorId: string,
  input: InventoryTransferInput,
) {
  if (input.originWarehouseId === input.destinationWarehouseId) {
    const error = new Error("El almacén de origen y el de destino deben ser diferentes.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const [origin, destination, item, driver] = await Promise.all([
    prisma.warehouse.findFirst({ where: { id: input.originWarehouseId, organizationId, isActive: true } }),
    prisma.warehouse.findFirst({ where: { id: input.destinationWarehouseId, organizationId, isActive: true } }),
    prisma.item.findFirst({ where: { id: input.itemId, organizationId, isActive: true, type: "MATERIAL" } }),
    prisma.user.findFirst({ where: { id: input.driverId, organizationId, isActive: true } }),
  ]);
  if (!origin || !destination || !item || !driver) {
    const error = new Error("El almacén, artículo o chofer seleccionado no está disponible.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const transfer = await prisma.$transaction(async (tx) => {
    const originBalance = await tx.inventoryBalance.findUnique({
      where: { warehouseId_itemId: { warehouseId: origin.id, itemId: item.id } },
    });
    const available = Number(originBalance?.quantity ?? 0);
    if (!originBalance || available < input.quantity) {
      const error = new Error(`No hay existencia suficiente en ${origin.name}. Disponible: ${available}.`);
      (error as Error & { status: number }).status = 400;
      throw error;
    }

    await tx.inventoryBalance.update({
      where: { id: originBalance.id },
      data: { quantity: (available - input.quantity).toFixed(2) },
    });
    const created = await tx.inventoryTransfer.create({
      data: {
        organizationId,
        originWarehouseId: origin.id,
        destinationWarehouseId: destination.id,
        itemId: item.id,
        createdById: actorId,
        driverId: driver.id,
        quantity: input.quantity.toFixed(2),
        unit: item.unit,
        notes: upper(input.notes),
      },
      include: transferInclude,
    });

    const reference = `${origin.code} → ${destination.code}`;
    await tx.inventoryMovement.create({
      data: {
        organizationId,
        warehouseId: origin.id,
        itemId: item.id,
        createdById: actorId,
        transferId: created.id,
        type: "TRANSFERENCIA_SALIDA",
        quantity: input.quantity.toFixed(2),
        unit: item.unit,
        reference,
        notes: `EN TRÁNSITO CON ${driver.name}${input.notes ? ` · ${upper(input.notes)}` : ""}`,
      },
    });
    await recordAudit(
      {
        organizationId,
        userId: actorId,
        action: "UPDATE",
        entityType: "INVENTORY_TRANSFER",
        entityId: created.id,
        summary: `Despachó ${input.quantity} ${item.unit ?? "unidad"} de ${item.name}: ${origin.name} a ${destination.name} con ${driver.name}`,
        before: { warehouseId: origin.id, quantity: available },
        after: { destinationWarehouseId: destination.id, status: "PENDIENTE", driverId: driver.id },
      },
      tx,
    );
    return created;
  });

  return mapTransfer(transfer);
}

export async function receiveInventoryTransfer(organizationId: string, actorId: string, transferId: string) {
  const previous = await prisma.inventoryTransfer.findFirst({
    where: { id: transferId, organizationId },
    include: transferInclude,
  });
  if (!previous) {
    const error = new Error("Transferencia no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  if (previous.status === "RECIBIDA") {
    const error = new Error("Esta transferencia ya fue recibida en el almacén destino.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.inventoryBalance.upsert({
      where: { warehouseId_itemId: { warehouseId: previous.destinationWarehouseId, itemId: previous.itemId } },
      update: { quantity: { increment: previous.quantity } },
      create: {
        warehouseId: previous.destinationWarehouseId,
        itemId: previous.itemId,
        quantity: previous.quantity,
      },
    });
    await tx.inventoryMovement.create({
      data: {
        organizationId,
        warehouseId: previous.destinationWarehouseId,
        itemId: previous.itemId,
        createdById: actorId,
        transferId: previous.id,
        type: "TRANSFERENCIA_ENTRADA",
        quantity: previous.quantity,
        unit: previous.unit,
        reference: `${previous.originWarehouse.code} → ${previous.destinationWarehouse.code}`,
        notes: "RECEPCIÓN CONFIRMADA EN ALMACÉN DESTINO",
      },
    });
    const received = await tx.inventoryTransfer.update({
      where: { id: previous.id },
      data: { status: "RECIBIDA", receivedById: actorId, receivedAt: new Date() },
      include: transferInclude,
    });
    await recordAudit(
      {
        organizationId,
        userId: actorId,
        action: "RECEIVE",
        entityType: "INVENTORY_TRANSFER",
        entityId: previous.id,
        summary: `Confirmó la recepción de ${previous.item.name} en ${previous.destinationWarehouse.name}`,
        before: { status: previous.status },
        after: { status: "RECIBIDA", receivedById: actorId },
      },
      tx,
    );
    return received;
  });

  return mapTransfer(transfer);
}

export async function createInventoryMovement(organizationId: string, actorId: string, warehouseId: string, input: InventoryMovementInput) {
  const [warehouse, item] = await Promise.all([
    prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId, isActive: true } }),
    prisma.item.findFirst({ where: { id: input.itemId, organizationId, isActive: true } }),
  ]);

  if (!warehouse || !item) {
    const error = new Error("El almacén o producto seleccionado no es válido.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.inventoryBalance.upsert({
      where: { warehouseId_itemId: { warehouseId, itemId: item.id } },
      update: {},
      create: { warehouseId, itemId: item.id, quantity: "0" },
    });
    const current = Number(balance.quantity);
    const delta = input.type === "SALIDA" ? -Math.abs(input.quantity) : input.quantity;
    const next = current + delta;

    if (next < 0) {
      const error = new Error(`No hay existencia suficiente. Disponible: ${current}.`);
      (error as Error & { status: number }).status = 400;
      throw error;
    }

    const updatedBalance = await tx.inventoryBalance.update({
      where: { id: balance.id },
      data: { quantity: next.toFixed(2) },
      include: { item: true },
    });
    const movement = await tx.inventoryMovement.create({
      data: {
        organizationId,
        warehouseId,
        itemId: item.id,
        createdById: actorId,
        type: input.type,
        quantity: Math.abs(input.quantity).toFixed(2),
        unit: upper(input.unit) ?? item.unit,
        reference: upper(input.reference),
        notes: upper(input.notes),
      },
      include: { item: true, createdBy: { select: { id: true, name: true } }, order: true },
    });
    await recordAudit(
      {
        organizationId,
        userId: actorId,
        action: input.type === "SALIDA" ? "INVENTORY_OUT" : "UPDATE",
        entityType: "INVENTORY",
        entityId: movement.id,
        summary: `${input.type === "SALIDA" ? "Registró salida" : "Ajustó existencia"} de ${item.name} en ${warehouse.name}`,
        before: { quantity: current },
        after: { quantity: next },
      },
      tx,
    );
    return { balance: updatedBalance, movement };
  });

  return {
    balance: { ...result.balance, quantity: result.balance.quantity.toString() },
    movement: { ...result.movement, quantity: result.movement.quantity.toString() },
  };
}

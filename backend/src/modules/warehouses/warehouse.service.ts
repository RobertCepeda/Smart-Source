import { recordAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import type { createWarehouseSchema, inventoryMovementSchema } from "./warehouse.schema";
import type { z } from "zod";

type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;

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
      project: upper(input.project),
      location: upper(input.location),
    },
    include: { balances: true, movements: true, _count: { select: { balances: true, movements: true, purchaseOrders: true } } },
  });

  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "WAREHOUSE", entityId: warehouse.id, summary: `Creó el almacén ${warehouse.name}`, after: warehouse });
  return mapWarehouse(warehouse);
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

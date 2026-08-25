import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { createInventoryMovement, createInventoryTransfer, createWarehouse, listInventoryTransfers, listWarehouses } from "./warehouse.service";
import { createWarehouseSchema, inventoryMovementSchema, inventoryTransferSchema, warehouseIdParamsSchema } from "./warehouse.schema";

export const warehouseRouter = Router();

warehouseRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return req.user.organizationId;
}

warehouseRouter.get("/", async (req, res, next) => {
  try {
    res.json({ warehouses: await listWarehouses(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

warehouseRouter.post("/", requirePermission("inventory:write"), validate({ body: createWarehouseSchema }), async (req, res, next) => {
  try {
    const warehouse = await createWarehouse(organizationId(req), req.user!.id, createWarehouseSchema.parse(req.body));
    res.status(201).json({ warehouse });
  } catch (error) {
    next(error);
  }
});

warehouseRouter.get("/transfers", async (req, res, next) => {
  try {
    res.json({ transfers: await listInventoryTransfers(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

warehouseRouter.post("/transfers", requirePermission("inventory:write"), validate({ body: inventoryTransferSchema }), async (req, res, next) => {
  try {
    const transfer = await createInventoryTransfer(organizationId(req), req.user!.id, inventoryTransferSchema.parse(req.body));
    res.status(201).json({ transfer });
  } catch (error) {
    next(error);
  }
});

warehouseRouter.post("/:id/movements", requirePermission("inventory:write"), validate({ params: warehouseIdParamsSchema, body: inventoryMovementSchema }), async (req, res, next) => {
  try {
    const { id } = warehouseIdParamsSchema.parse(req.params);
    const result = await createInventoryMovement(organizationId(req), req.user!.id, id, inventoryMovementSchema.parse(req.body));
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

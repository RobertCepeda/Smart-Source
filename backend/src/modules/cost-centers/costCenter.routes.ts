import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { createCostCenterSchema, costCenterIdParamsSchema, updateCostCenterSchema } from "./costCenter.schema";
import { createCostCenter, listCostCenters, updateCostCenter } from "./costCenter.service";

export const costCenterRouter = Router();
costCenterRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return req.user.organizationId;
}

costCenterRouter.get("/", async (req, res, next) => {
  try {
    res.json({ costCenters: await listCostCenters(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

costCenterRouter.post("/", requirePermission("organization:manage"), validate({ body: createCostCenterSchema }), async (req, res, next) => {
  try {
    const costCenter = await createCostCenter(organizationId(req), req.user!.id, createCostCenterSchema.parse(req.body));
    res.status(201).json({ costCenter });
  } catch (error) {
    next(error);
  }
});

costCenterRouter.put("/:id", requirePermission("organization:manage"), validate({ params: costCenterIdParamsSchema, body: updateCostCenterSchema }), async (req, res, next) => {
  try {
    const { id } = costCenterIdParamsSchema.parse(req.params);
    const costCenter = await updateCostCenter(organizationId(req), req.user!.id, id, updateCostCenterSchema.parse(req.body));
    res.json({ costCenter });
  } catch (error) {
    next(error);
  }
});

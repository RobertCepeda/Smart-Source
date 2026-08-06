import { Router } from "express";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  createSupplierSchema,
  supplierIdParamsSchema,
  supplierQuerySchema,
  updateSupplierSchema,
} from "./supplier.schema";
import {
  createSupplier,
  deactivateSupplier,
  getSupplierById,
  listSuppliers,
  restoreSupplier,
  updateSupplier,
} from "./supplier.service";
import { createContactForSupplier } from "../contacts/contact.service";
import { createContactSchema } from "../contacts/contact.schema";

export const supplierRouter = Router();

supplierRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

supplierRouter.get("/", validate({ query: supplierQuerySchema }), async (req, res, next) => {
  try {
    const suppliers = await listSuppliers(organizationId(req), supplierQuerySchema.parse(req.query));
    res.json({ suppliers });
  } catch (error) {
    next(error);
  }
});

supplierRouter.post("/", requirePermission("suppliers:write"), validate({ body: createSupplierSchema }), async (req, res, next) => {
  try {
    const supplier = await createSupplier(organizationId(req), req.user!.id, createSupplierSchema.parse(req.body));
    res.status(201).json({ supplier });
  } catch (error) {
    next(error);
  }
});

supplierRouter.get("/:id", validate({ params: supplierIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = supplierIdParamsSchema.parse(req.params);
    const supplier = await getSupplierById(organizationId(req), id);
    res.json({ supplier });
  } catch (error) {
    next(error);
  }
});

supplierRouter.put(
  "/:id",
  requirePermission("suppliers:write"),
  validate({ params: supplierIdParamsSchema, body: updateSupplierSchema }),
  async (req, res, next) => {
    try {
      const { id } = supplierIdParamsSchema.parse(req.params);
      const supplier = await updateSupplier(organizationId(req), req.user!.id, id, updateSupplierSchema.parse(req.body));
      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  },
);

supplierRouter.delete("/:id", requirePermission("suppliers:write"), validate({ params: supplierIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = supplierIdParamsSchema.parse(req.params);
    await deactivateSupplier(organizationId(req), req.user!.id, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

supplierRouter.post("/:id/restore", requirePermission("suppliers:write"), validate({ params: supplierIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = supplierIdParamsSchema.parse(req.params);
    await restoreSupplier(organizationId(req), req.user!.id, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

supplierRouter.post(
  "/:id/contacts",
  requirePermission("suppliers:write"),
  validate({ params: supplierIdParamsSchema, body: createContactSchema }),
  async (req, res, next) => {
    try {
      const { id } = supplierIdParamsSchema.parse(req.params);
      const contact = await createContactForSupplier(organizationId(req), req.user!.id, id, createContactSchema.parse(req.body));
      res.status(201).json({ contact });
    } catch (error) {
      next(error);
    }
  },
);

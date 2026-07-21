import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
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

supplierRouter.post("/", validate({ body: createSupplierSchema }), async (req, res, next) => {
  try {
    const supplier = await createSupplier(organizationId(req), createSupplierSchema.parse(req.body));
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
  validate({ params: supplierIdParamsSchema, body: updateSupplierSchema }),
  async (req, res, next) => {
    try {
      const { id } = supplierIdParamsSchema.parse(req.params);
      const supplier = await updateSupplier(organizationId(req), id, updateSupplierSchema.parse(req.body));
      res.json({ supplier });
    } catch (error) {
      next(error);
    }
  },
);

supplierRouter.delete("/:id", validate({ params: supplierIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = supplierIdParamsSchema.parse(req.params);
    await deactivateSupplier(organizationId(req), id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

supplierRouter.post(
  "/:id/contacts",
  validate({ params: supplierIdParamsSchema, body: createContactSchema }),
  async (req, res, next) => {
    try {
      const { id } = supplierIdParamsSchema.parse(req.params);
      const contact = await createContactForSupplier(organizationId(req), id, createContactSchema.parse(req.body));
      res.status(201).json({ contact });
    } catch (error) {
      next(error);
    }
  },
);

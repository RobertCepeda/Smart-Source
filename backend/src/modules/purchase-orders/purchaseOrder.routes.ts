import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../auth/auth.middleware";
import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  purchaseOrderIdParamsSchema,
  updateOrderStatusSchema,
} from "./purchaseOrder.schema";
import {
  createPurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  updatePurchaseOrderStatus,
} from "./purchaseOrder.service";

export const purchaseOrderRouter = Router();

purchaseOrderRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

purchaseOrderRouter.get("/", validate({ query: listPurchaseOrdersQuerySchema }), async (req, res, next) => {
  try {
    const orders = await listPurchaseOrders(organizationId(req), listPurchaseOrdersQuerySchema.parse(req.query));
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

purchaseOrderRouter.post("/", validate({ body: createPurchaseOrderSchema }), async (req, res, next) => {
  try {
    const order = await createPurchaseOrder(organizationId(req), createPurchaseOrderSchema.parse(req.body));
    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

purchaseOrderRouter.get("/:id", validate({ params: purchaseOrderIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = purchaseOrderIdParamsSchema.parse(req.params);
    const order = await getPurchaseOrder(organizationId(req), id);
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

purchaseOrderRouter.put(
  "/:id/status",
  validate({ params: purchaseOrderIdParamsSchema, body: updateOrderStatusSchema }),
  async (req, res, next) => {
    try {
      const { id } = purchaseOrderIdParamsSchema.parse(req.params);
      const order = await updatePurchaseOrderStatus(organizationId(req), id, updateOrderStatusSchema.parse(req.body));
      res.json({ order });
    } catch (error) {
      next(error);
    }
  },
);

purchaseOrderRouter.get("/:id/pdf", validate({ params: purchaseOrderIdParamsSchema }), async (req, res, next) => {
  try {
    await getPurchaseOrder(organizationId(req), purchaseOrderIdParamsSchema.parse(req.params).id);
    res.status(501).json({
      message: "La exportación PDF queda reservada para el siguiente pulido de órdenes.",
    });
  } catch (error) {
    next(error);
  }
});

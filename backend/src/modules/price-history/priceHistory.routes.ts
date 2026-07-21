import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../auth/auth.middleware";
import { priceHistoryQuerySchema } from "./priceHistory.schema";
import { getPriceHistory } from "./priceHistory.service";

export const priceHistoryRouter = Router();

priceHistoryRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

priceHistoryRouter.get("/", validate({ query: priceHistoryQuerySchema }), async (req, res, next) => {
  try {
    const data = await getPriceHistory(organizationId(req), priceHistoryQuerySchema.parse(req.query));
    res.json(data);
  } catch (error) {
    next(error);
  }
});

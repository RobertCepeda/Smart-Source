import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../auth/auth.middleware";
import { searchQuerySchema } from "./search.schema";
import { globalSearch } from "./search.service";

export const searchRouter = Router();

searchRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

searchRouter.get("/", validate({ query: searchQuerySchema }), async (req, res, next) => {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const results = await globalSearch(organizationId(req), q);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

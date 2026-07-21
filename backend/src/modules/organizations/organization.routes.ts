import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getOrganizationWorkspace } from "./organization.service";

export const organizationRouter = Router();

organizationRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

organizationRouter.get("/", async (req, res, next) => {
  try {
    res.json(await getOrganizationWorkspace(organizationId(req)));
  } catch (error) {
    next(error);
  }
});

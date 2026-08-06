import { Router } from "express";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import { auditQuerySchema, organizationUserParamsSchema, updateOrganizationUserSchema } from "./organization.schema";
import { getOrganizationWorkspace, listAuditLogs, updateOrganizationUser } from "./organization.service";

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

organizationRouter.get("/audit", requirePermission("organization:manage"), validate({ query: auditQuerySchema }), async (req, res, next) => {
  try {
    const { limit } = auditQuerySchema.parse(req.query);
    res.json({ logs: await listAuditLogs(organizationId(req), limit) });
  } catch (error) {
    next(error);
  }
});

organizationRouter.put("/users/:userId", requirePermission("organization:manage"), validate({ params: organizationUserParamsSchema, body: updateOrganizationUserSchema }), async (req, res, next) => {
  try {
    const { userId } = organizationUserParamsSchema.parse(req.params);
    const input = updateOrganizationUserSchema.parse(req.body);
    res.json({ user: await updateOrganizationUser(organizationId(req), req.user!.id, userId, input) });
  } catch (error) {
    next(error);
  }
});

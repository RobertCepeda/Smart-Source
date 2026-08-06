import { Router } from "express";
import { authenticate, requirePermission } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createSupportTicket, listOrganizationTickets, updateSupportTicketStatus } from "./support.service";
import { createSupportTicketSchema, supportTicketQuerySchema, ticketIdParamsSchema, updateSupportStatusSchema } from "./support.schema";

export const supportRouter = Router();

supportRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

supportRouter.get("/tickets", validate({ query: supportTicketQuerySchema }), async (req, res, next) => {
  try {
    const { group } = supportTicketQuerySchema.parse(req.query);
    res.json({ tickets: await listOrganizationTickets(organizationId(req), group) });
  } catch (error) {
    next(error);
  }
});

supportRouter.put("/tickets/:id/status", requirePermission("organization:manage"), validate({ params: ticketIdParamsSchema, body: updateSupportStatusSchema }), async (req, res, next) => {
  try {
    const { id } = ticketIdParamsSchema.parse(req.params);
    const { status } = updateSupportStatusSchema.parse(req.body);
    res.json({ ticket: await updateSupportTicketStatus(organizationId(req), req.user!.id, id, status) });
  } catch (error) {
    next(error);
  }
});

supportRouter.post("/tickets", validate({ body: createSupportTicketSchema }), async (req, res, next) => {
  try {
    const ticket = await createSupportTicket(organizationId(req), req.user!.id, createSupportTicketSchema.parse(req.body));
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

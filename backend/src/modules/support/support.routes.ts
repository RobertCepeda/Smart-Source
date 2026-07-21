import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createSupportTicket, listOrganizationTickets } from "./support.service";
import { createSupportTicketSchema } from "./support.schema";

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

supportRouter.get("/tickets", async (req, res, next) => {
  try {
    res.json({ tickets: await listOrganizationTickets(organizationId(req)) });
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

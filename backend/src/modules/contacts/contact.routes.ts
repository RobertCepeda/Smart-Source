import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import { contactIdParamsSchema, updateContactSchema } from "./contact.schema";
import { deleteContact, updateContact } from "./contact.service";

export const contactRouter = Router();

contactRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

contactRouter.put("/:id", validate({ params: contactIdParamsSchema, body: updateContactSchema }), async (req, res, next) => {
  try {
    const { id } = contactIdParamsSchema.parse(req.params);
    const contact = await updateContact(organizationId(req), id, updateContactSchema.parse(req.body));
    res.json({ contact });
  } catch (error) {
    next(error);
  }
});

contactRouter.delete("/:id", validate({ params: contactIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = contactIdParamsSchema.parse(req.params);
    await deleteContact(organizationId(req), id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

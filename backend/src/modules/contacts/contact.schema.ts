import { z } from "zod";

const optionalString = z.string().trim().optional();
const optionalEmail = z.union([z.string().trim().email(), z.literal("")]).optional();

export const contactIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "El contacto necesita nombre"),
  role: optionalString,
  phone: optionalString,
  whatsapp: optionalString,
  email: optionalEmail,
  isPrimary: z.boolean().optional(),
});

export const updateContactSchema = createContactSchema.partial();

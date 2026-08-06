import { z } from "zod";

const optionalString = z.string().trim().optional();
const optionalEmail = z.union([z.string().trim().email(), z.literal("")]).optional();

export const contactIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "El contacto necesita nombre"),
  role: z.string().trim().min(2, "El cargo es obligatorio"),
  phone: z.string().trim().min(7, "El teléfono es obligatorio"),
  whatsapp: optionalString,
  email: optionalEmail,
  isPrimary: z.boolean().optional(),
});

export const updateContactSchema = createContactSchema.partial();

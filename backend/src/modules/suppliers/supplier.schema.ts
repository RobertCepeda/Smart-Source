import { z } from "zod";

const optionalString = z.string().trim().optional();
const optionalEmail = z.union([z.string().trim().email(), z.literal("")]).optional();
const optionalUrl = z.union([z.string().trim().url(), z.literal("")]).optional();

export const supplierIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const supplierQuerySchema = z.object({
  search: optionalString,
  category: optionalString,
  city: optionalString,
  tag: optionalString,
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(2, "El contacto necesita nombre"),
  role: z.string().trim().min(2, "El cargo es obligatorio"),
  phone: z.string().trim().min(7, "El teléfono es obligatorio"),
  whatsapp: optionalString,
  email: optionalEmail,
  isPrimary: z.boolean().optional(),
});

export const catalogItemInputSchema = z.object({
  name: z.string().trim().min(2),
  type: z.enum(["MATERIAL", "SERVICIO"]).default("MATERIAL"),
  unit: optionalString,
  lastPrice: z.union([z.coerce.number().nonnegative(), z.literal("")]).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "El suplidor necesita nombre"),
  rnc: z.string().trim().min(5, "El RNC o cédula es obligatorio"),
  city: optionalString,
  address: optionalString,
  phone: z.string().trim().min(7, "El teléfono es obligatorio"),
  whatsapp: optionalString,
  email: optionalEmail,
  website: optionalUrl,
  instagram: optionalString,
  facebook: optionalString,
  notes: optionalString,
  rating: z.coerce.number().int().min(0).max(5).optional(),
  contacts: z.array(contactInputSchema).min(1, "Agrega el contacto principal"),
  tags: z.array(z.string().trim().min(1)).optional(),
  catalogItems: z.array(catalogItemInputSchema).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

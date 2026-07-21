import { z } from "zod";

const optionalString = z.string().trim().optional();

export const itemIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listItemsQuerySchema = z.object({
  search: optionalString,
  type: z.enum(["MATERIAL", "SERVICIO"]).optional(),
  categoryId: optionalString,
  brandId: optionalString,
});

export const createItemSchema = z.object({
  name: z.string().trim().min(2, "El item necesita nombre"),
  type: z.enum(["MATERIAL", "SERVICIO"]).default("MATERIAL"),
  unit: optionalString,
  categoryId: optionalString,
  brandId: optionalString,
  description: optionalString,
});

export const updateItemSchema = createItemSchema.partial();

export const createNamedEntitySchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
});

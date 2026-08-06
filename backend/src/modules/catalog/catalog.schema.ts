import { z } from "zod";

const optionalString = z.string().trim().optional();

export const itemIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listItemsQuerySchema = z.object({
  search: optionalString,
  type: z.enum(["MATERIAL", "SERVICIO"]).optional(),
  categoryId: optionalString,
  subcategoryId: optionalString,
  brandId: optionalString,
});

export const createItemSchema = z.object({
  name: z.string().trim().min(2, "El item necesita nombre"),
  type: z.enum(["MATERIAL", "SERVICIO"]).default("MATERIAL"),
  unit: optionalString,
  categoryId: optionalString,
  subcategoryId: optionalString,
  brandId: optionalString,
  description: optionalString,
});

export const updateItemSchema = createItemSchema.partial();

export const createNamedEntitySchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
});

export const listSubcategoriesQuerySchema = z.object({
  categoryId: optionalString,
});

export const createSubcategorySchema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoría"),
  name: z.string().trim().min(2, "El nombre es obligatorio"),
});

export const createUnitSchema = z.object({
  name: z.string().trim().min(1, "La unidad es obligatoria").max(40),
  abbreviation: z.string().trim().max(16).optional(),
});

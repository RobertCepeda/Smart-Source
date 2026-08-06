import { z } from "zod";

export const warehouseIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  code: z.string().trim().min(2, "El código es obligatorio").max(20),
  type: z.enum(["GENERAL", "PROJECT"]).default("GENERAL"),
  project: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().min(1, "Selecciona un producto"),
  type: z.enum(["SALIDA", "AJUSTE"]),
  quantity: z.coerce.number().refine((value) => value !== 0, "La cantidad no puede ser cero"),
  unit: z.string().trim().optional(),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

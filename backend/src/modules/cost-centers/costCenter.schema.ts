import { z } from "zod";

export const costCenterIdParamsSchema = z.object({ id: z.string().min(1) });

export const createCostCenterSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z]+-\d+$/, "Usa letras, guion y números; por ejemplo CC-204."),
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(400).optional(),
});

export const updateCostCenterSchema = createCostCenterSchema.partial().extend({
  isActive: z.boolean().optional(),
});

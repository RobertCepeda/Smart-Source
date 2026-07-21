import { z } from "zod";

export const priceHistoryQuerySchema = z.object({
  itemId: z.string().optional(),
  supplierId: z.string().optional(),
});

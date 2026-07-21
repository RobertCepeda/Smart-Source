import { z } from "zod";

export const purchaseOrderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listPurchaseOrdersQuerySchema = z.object({
  status: z.enum(["BORRADOR", "ENVIADA", "RECIBIDA", "CANCELADA"]).optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().trim().max(80).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un suplidor."),
  issueDate: z.string().optional(),
  currency: z.string().trim().min(3).max(3).default("DOP"),
  taxRate: z.coerce.number().min(0).max(1).default(0.18),
  notes: z.string().trim().max(800).optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1, "Selecciona un item."),
        quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
        unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
      }),
    )
    .min(1, "Agrega al menos una linea."),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["BORRADOR", "ENVIADA", "RECIBIDA", "CANCELADA"]),
});

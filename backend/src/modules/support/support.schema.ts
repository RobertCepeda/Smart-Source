import { z } from "zod";

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(4, "El asunto es obligatorio"),
  category: z.enum(["SOPORTE", "MANTENIMIENTO", "FACTURACION", "IDEA"]).default("SOPORTE"),
  priority: z.enum(["BAJA", "NORMAL", "ALTA"]).default("NORMAL"),
  message: z.string().trim().min(8, "Escribe un poco mas de detalle"),
});

export const ticketIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const supportTicketQuerySchema = z.object({
  group: z.enum(["ALL", "OPEN", "CLOSED", "STANDBY"]).default("ALL"),
});

export const updateSupportStatusSchema = z.object({
  status: z.enum(["ABIERTO", "EN_REVISION", "EN_ESPERA", "RESUELTO", "CERRADO"]),
});

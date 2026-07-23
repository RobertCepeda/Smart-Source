import { z } from "zod";

const quoteRequestStatus = z.enum([
  "BORRADOR",
  "LISTA_PARA_ENVIAR",
  "ENVIADA",
  "RECIBIENDO_COTIZACIONES",
  "CERRADA",
  "CANCELADA",
]);

export const quoteRequestIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listQuoteRequestsQuerySchema = z.object({
  status: quoteRequestStatus.optional(),
  search: z.string().trim().max(80).optional(),
});

export const createQuoteRequestSchema = z.object({
  project: z.string().trim().min(2, "Indica el proyecto o centro de costo.").max(160),
  costCenter: z.string().trim().max(80).optional(),
  requesterName: z.string().trim().max(120).optional(),
  deadline: z.string().trim().optional(),
  observations: z.string().trim().max(1500).optional(),
  supplierIds: z.array(z.string().min(1)).max(40).optional().default([]),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(2, "Describe el material, equipo o servicio.").max(260),
        quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
        unit: z.string().trim().min(1, "Indica la unidad.").max(40),
        technicalSpecs: z.string().trim().max(1200).optional(),
      }),
    )
    .min(1, "Agrega al menos un item.")
    .max(80, "Divide la solicitud si tienes más de 80 items."),
});

export const quoteRequestSupplierParamsSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().min(1),
});

export const createSupplierQuoteSchema = z.object({
  supplierId: z.string().min(1, "Selecciona el suplidor que envió la cotización."),
  receivedAt: z.string().trim().optional(),
  observations: z.string().trim().max(1200).optional(),
});

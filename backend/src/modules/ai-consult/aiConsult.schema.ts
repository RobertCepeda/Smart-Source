import { z } from "zod";

export const aiDocumentParamsSchema = z.object({
  id: z.string().min(1),
});

export const askAiDocumentSchema = z.object({
  question: z.string().trim().min(3, "Escribe una pregunta más completa."),
});

import { z } from "zod";

export const aiDocumentParamsSchema = z.object({
  id: z.string().min(1),
});

export const aiChatParamsSchema = z.object({
  id: z.string().min(1),
});

export const createAiChatSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const askAiDocumentSchema = z.object({
  question: z.string().trim().min(3, "Escribe una pregunta más completa."),
});

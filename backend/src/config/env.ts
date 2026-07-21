import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  OPENAI_MODEL: z
    .string()
    .optional()
    .transform((value) => value?.trim() || "gpt-5.6-sol"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

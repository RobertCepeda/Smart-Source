import { z } from "zod";

export const organizationUserParamsSchema = z.object({
  userId: z.string().min(1),
});

export const updateOrganizationUserSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "BUYER", "WAREHOUSE", "VIEWER", "CLIENT"]),
  isActive: z.boolean().optional(),
});

export const createOrganizationUserSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio.").max(120),
  email: z.string().trim().email("Escribe un correo válido."),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres.").max(128),
  role: z.enum(["ADMIN", "MANAGER", "BUYER", "WAREHOUSE", "VIEWER", "CLIENT"]),
});

export const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

import { z } from "zod";

export const organizationUserParamsSchema = z.object({
  userId: z.string().min(1),
});

export const updateOrganizationUserSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "BUYER", "WAREHOUSE", "VIEWER", "CLIENT"]),
  isActive: z.boolean().optional(),
});

export const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  company: z.string().trim().min(2).optional(),
  accountType: z.enum(["PERSONAL", "BUSINESS"]).default("PERSONAL"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  company: z.string().trim().min(2).optional(),
  avatarUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
});

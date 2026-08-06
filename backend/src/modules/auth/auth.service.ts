import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import type { loginSchema, registerSchema, updateProfileSchema } from "./auth.schema";
import type { z } from "zod";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

type AuthUser = {
  id: string;
  organizationId: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    accountType: string;
    plan: string;
  } | null;
  name: string;
  email: string;
  company: string | null;
  avatarUrl: string | null;
  authProvider: string;
  role: string;
};

function publicUser(user: AuthUser) {
  return {
    id: user.id,
    organizationId: user.organizationId,
    organization: user.organization ?? null,
    name: user.name,
    email: user.email,
    company: user.company,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    role: user.role,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function createUniqueOrganizationSlug(name: string) {
  const base = slugify(name) || "organizacion";
  let slug = base;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

function signToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export async function register(input: RegisterInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error("Ya existe una cuenta con este correo.");
    (error as Error & { status: number }).status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const organizationName = input.company || `${input.name} Organization`;
  const organizationSlug = await createUniqueOrganizationSlug(organizationName);
  const plan = input.accountType === "BUSINESS" ? "BUSINESS" : "PERSONAL";

  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        billingEmail: normalizedEmail,
        accountType: input.accountType,
        plan,
      },
    });

    return tx.user.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        email: normalizedEmail,
        company: input.company ?? organization.name,
        passwordHash,
        role: "OWNER",
      },
      include: { organization: true },
    });
  });

  return {
    token: signToken(user),
    user: publicUser(user),
  };
}

export async function login(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { organization: true },
  });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const error = new Error("La cuenta está temporalmente bloqueada. Intenta nuevamente en 15 minutos.");
    (error as Error & { status: number }).status = 429;
    throw error;
  }

  const isValidPassword = user?.passwordHash ? await bcrypt.compare(input.password, user.passwordHash) : false;

  if (!user || !isValidPassword || !user.isActive) {
    if (user?.isActive) {
      const attempts = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts >= 5 ? 0 : attempts,
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
    }
    const error = new Error("Correo o contraseña incorrecta.");
    (error as Error & { status: number }).status = 401;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    include: { organization: true },
  });

  return {
    token: signToken(updatedUser),
    user: publicUser(updatedUser),
  };
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return publicUser(user);
}

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(cleanString(input.name) ? { name: cleanString(input.name) } : {}),
      ...(cleanString(input.company) ? { company: cleanString(input.company) } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: cleanString(input.avatarUrl) ?? null } : {}),
    },
    include: { organization: true },
  });

  return publicUser(user);
}

import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../lib/audit";
import bcrypt from "bcryptjs";

export async function getOrganizationWorkspace(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!organization) {
    const error = new Error("Organización no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const [activeUsers, activeSuppliers, activeItems, supportTickets, orders, openTickets, warehouses] = await Promise.all([
    prisma.user.count({ where: { organizationId, isActive: true } }),
    prisma.supplier.count({ where: { organizationId, isActive: true } }),
    prisma.item.count({ where: { organizationId, isActive: true } }),
    prisma.supportTicket.count({ where: { organizationId } }),
    prisma.purchaseOrder.count({ where: { organizationId } }),
    prisma.supportTicket.count({ where: { organizationId, status: { in: ["ABIERTO", "EN_REVISION"] } } }),
    prisma.warehouse.count({ where: { organizationId, isActive: true } }),
  ]);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingEmail: organization.billingEmail,
      status: organization.status,
      accountType: organization.accountType,
      plan: organization.plan,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      counts: {
        users: activeUsers,
        suppliers: activeSuppliers,
        items: activeItems,
        supportTickets,
        orders,
        openTickets,
        warehouses,
      },
    },
    users: organization.users,
  };
}

export async function updateOrganizationUser(organizationId: string, actorId: string, userId: string, input: { role: "ADMIN" | "MANAGER" | "BUYER" | "WAREHOUSE" | "VIEWER" | "CLIENT"; isActive?: boolean }) {
  if (actorId === userId) {
    const error = new Error("No puedes cambiar tu propio nivel de acceso. Otro administrador debe hacerlo.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const previous = await prisma.user.findFirst({ where: { id: userId, organizationId, role: { notIn: ["SYSTEM_ADMIN", "OWNER"] } } });
  if (!previous) {
    const error = new Error("Usuario no encontrado dentro de la organización.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: input.role, ...(input.isActive === undefined ? {} : { isActive: input.isActive }) },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  await recordAudit({ organizationId, userId: actorId, action: "UPDATE", entityType: "USER", entityId: user.id, summary: `Actualizó acceso de ${user.name}`, before: { role: previous.role, isActive: previous.isActive }, after: { role: user.role, isActive: user.isActive } });
  return user;
}

export async function createOrganizationUser(
  organizationId: string,
  actorId: string,
  input: { name: string; email: string; password: string; role: "ADMIN" | "MANAGER" | "BUYER" | "WAREHOUSE" | "VIEWER" | "CLIENT" },
) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error("Ya existe una cuenta con ese correo.");
    (error as Error & { status: number }).status = 409;
    throw error;
  }

  const user = await prisma.user.create({
    data: {
      organizationId,
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      authProvider: "EMAIL",
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  await recordAudit({
    organizationId,
    userId: actorId,
    action: "CREATE",
    entityType: "USER",
    entityId: user.id,
    summary: `Creó el acceso de ${user.name}`,
    after: { id: user.id, email: user.email, role: user.role, isActive: user.isActive },
  });
  return user;
}

export async function listAuditLogs(organizationId: string, limit: number) {
  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => {
    const metadata = (log.metadata ?? {}) as Record<string, unknown>;
    return {
      ...log,
      entityType: log.entity,
      summary: log.summary ?? log.action,
      before: metadata.before ?? null,
      after: metadata.after ?? null,
      metadata,
    };
  });
}

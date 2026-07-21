import { prisma } from "../../lib/prisma";

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

  const [activeUsers, activeSuppliers, activeItems, supportTickets, orders, openTickets] = await Promise.all([
    prisma.user.count({ where: { organizationId, isActive: true } }),
    prisma.supplier.count({ where: { organizationId, isActive: true } }),
    prisma.item.count({ where: { organizationId, isActive: true } }),
    prisma.supportTicket.count({ where: { organizationId } }),
    prisma.purchaseOrder.count({ where: { supplier: { organizationId } } }),
    prisma.supportTicket.count({ where: { organizationId, status: { in: ["ABIERTO", "EN_REVISION"] } } }),
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
      },
    },
    users: organization.users,
  };
}

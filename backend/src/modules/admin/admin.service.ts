import { prisma } from "../../lib/prisma";
import { listAllTickets } from "../support/support.service";

export async function getAdminOverview() {
  const [organizations, users, suppliers, openTickets] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["ABIERTO", "EN_REVISION"] } } }),
  ]);

  return { organizations, users, suppliers, openTickets };
}

export async function listOrganizationsForAdmin() {
  return prisma.organization.findMany({
    include: {
      _count: { select: { users: true, suppliers: true, supportTickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSupportTicketsForAdmin() {
  return listAllTickets();
}

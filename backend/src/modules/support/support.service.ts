import { prisma } from "../../lib/prisma";
import type { createSupportTicketSchema } from "./support.schema";
import type { z } from "zod";

type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

function mapTicket(ticket: any) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    organization: ticket.organization,
    requester: ticket.requester,
    messages: ticket.messages,
  };
}

export async function listOrganizationTickets(organizationId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { organizationId },
    include: { messages: { orderBy: { createdAt: "asc" } }, organization: true, requester: true },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(mapTicket);
}

export async function createSupportTicket(organizationId: string, requesterId: string, input: CreateSupportTicketInput) {
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId,
      requesterId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      messages: {
        create: [
          {
            authorId: requesterId,
            authorType: "CLIENTE",
            body: input.message,
          },
          {
            authorType: "AUTOMATICO",
            body: "Recibimos tu solicitud. El equipo de Smart Source la revisara y te dara seguimiento desde este centro.",
          },
        ],
      },
    },
    include: { messages: { orderBy: { createdAt: "asc" } }, organization: true, requester: true },
  });

  return mapTicket(ticket);
}

export async function listAllTickets() {
  const tickets = await prisma.supportTicket.findMany({
    include: { messages: { orderBy: { createdAt: "asc" } }, organization: true, requester: true },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(mapTicket);
}

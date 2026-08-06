import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../lib/audit";
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

export async function listOrganizationTickets(organizationId: string, group: "ALL" | "OPEN" | "CLOSED" | "STANDBY" = "ALL") {
  const statuses =
    group === "OPEN"
      ? ["ABIERTO", "EN_REVISION"]
      : group === "CLOSED"
        ? ["RESUELTO", "CERRADO"]
        : group === "STANDBY"
          ? ["EN_ESPERA"]
          : undefined;
  const tickets = await prisma.supportTicket.findMany({
    where: { organizationId, ...(statuses ? { status: { in: statuses as any } } : {}) },
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

  await recordAudit({ organizationId, userId: requesterId, action: "CREATE", entityType: "SUPPORT_TICKET", entityId: ticket.id, summary: `Creó la solicitud de atención ${ticket.subject}`, after: ticket });

  return mapTicket(ticket);
}

export async function updateSupportTicketStatus(organizationId: string, actorId: string, id: string, status: "ABIERTO" | "EN_REVISION" | "EN_ESPERA" | "RESUELTO" | "CERRADO") {
  const previous = await prisma.supportTicket.findFirst({ where: { id, organizationId } });
  if (!previous) {
    const error = new Error("Solicitud de atención no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
    include: { messages: { orderBy: { createdAt: "asc" } }, organization: true, requester: true },
  });
  await recordAudit({ organizationId, userId: actorId, action: "STATUS_CHANGE", entityType: "SUPPORT_TICKET", entityId: id, summary: `Cambió el estado de ${ticket.subject} a ${status}`, before: { status: previous.status }, after: { status } });
  return mapTicket(ticket);
}

export async function listAllTickets() {
  const tickets = await prisma.supportTicket.findMany({
    include: { messages: { orderBy: { createdAt: "asc" } }, organization: true, requester: true },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(mapTicket);
}

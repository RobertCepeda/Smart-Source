import type { z } from "zod";
import { prisma } from "../../lib/prisma";
import type { createQuoteRequestSchema, listQuoteRequestsQuerySchema } from "./quoteRequest.schema";

type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
type ListQuoteRequestsQuery = z.infer<typeof listQuoteRequestsQuerySchema>;

const quoteRequestInclude = {
  requester: { select: { id: true, name: true, email: true } },
  items: { orderBy: { lineNumber: "asc" as const } },
  attachments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  },
};

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function decimalString(value: number) {
  return Number(value.toFixed(2)).toFixed(2);
}

function mapQuoteRequest(request: any) {
  return {
    id: request.id,
    number: request.number,
    status: request.status,
    project: request.project,
    costCenter: request.costCenter,
    requesterName: request.requesterName,
    deadline: request.deadline,
    observations: request.observations,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    requester: request.requester,
    items: request.items.map((item: any) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit,
      technicalSpecs: item.technicalSpecs,
    })),
    attachments: request.attachments,
    itemCount: request.items.length,
    attachmentCount: request.attachments.length,
  };
}

async function nextQuoteRequestNumber(tx: any) {
  const year = new Date().getFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const baseCount = await tx.quoteRequest.count({
    where: { createdAt: { gte: start, lt: end } },
  });

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const number = `SC-${year}-${String(baseCount + attempt).padStart(5, "0")}`;
    const existing = await tx.quoteRequest.findUnique({ where: { number } });

    if (!existing) {
      return number;
    }
  }

  return `SC-${year}-${Date.now()}`;
}

function parseDeadline(value?: string) {
  const cleaned = cleanString(value);
  return cleaned ? new Date(`${cleaned}T23:59:59.999Z`) : undefined;
}

export async function listQuoteRequests(organizationId: string, query: ListQuoteRequestsQuery) {
  const search = cleanString(query.search);
  const requests = await prisma.quoteRequest.findMany({
    where: {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" as const } },
              { project: { contains: search, mode: "insensitive" as const } },
              { costCenter: { contains: search, mode: "insensitive" as const } },
              { requesterName: { contains: search, mode: "insensitive" as const } },
              { observations: { contains: search, mode: "insensitive" as const } },
              { items: { some: { description: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    },
    include: quoteRequestInclude,
    orderBy: { createdAt: "desc" },
  });

  return requests.map(mapQuoteRequest);
}

export async function getQuoteRequest(organizationId: string, id: string) {
  const request = await prisma.quoteRequest.findFirst({
    where: { id, organizationId },
    include: quoteRequestInclude,
  });

  if (!request) {
    const error = new Error("Solicitud de cotización no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return mapQuoteRequest(request);
}

export async function createQuoteRequest(
  organizationId: string,
  requesterId: string | null,
  input: CreateQuoteRequestInput,
  attachments: Express.Multer.File[] = [],
) {
  const requester = requesterId
    ? await prisma.user.findFirst({
        where: { id: requesterId, organizationId },
        select: { name: true },
      })
    : null;

  const request = await prisma.$transaction(async (tx) => {
    const number = await nextQuoteRequestNumber(tx);

    return tx.quoteRequest.create({
      data: {
        organizationId,
        requesterId,
        number,
        project: input.project.trim(),
        costCenter: cleanString(input.costCenter),
        requesterName: cleanString(input.requesterName) ?? requester?.name ?? "Solicitante",
        deadline: parseDeadline(input.deadline),
        observations: cleanString(input.observations),
        items: {
          create: input.items.map((item, index) => ({
            lineNumber: index + 1,
            description: item.description.trim(),
            quantity: decimalString(item.quantity),
            unit: item.unit.trim(),
            technicalSpecs: cleanString(item.technicalSpecs),
          })),
        },
        attachments: {
          create: attachments.map((file) => ({
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            content: new Uint8Array(file.buffer) as any,
          })),
        },
      },
      include: quoteRequestInclude,
    });
  });

  return mapQuoteRequest(request);
}

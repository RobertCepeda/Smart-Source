import type { z } from "zod";
import { recordAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import type { createCostCenterSchema, updateCostCenterSchema } from "./costCenter.schema";

type CreateCostCenterInput = z.infer<typeof createCostCenterSchema>;
type UpdateCostCenterInput = z.infer<typeof updateCostCenterSchema>;

function upper(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toLocaleUpperCase("es") : undefined;
}

const costCenterInclude = {
  _count: { select: { quoteRequests: true, purchaseOrders: true } },
};

export async function listCostCenters(organizationId: string) {
  return prisma.costCenter.findMany({
    where: { organizationId },
    include: costCenterInclude,
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });
}

export async function createCostCenter(organizationId: string, actorId: string, input: CreateCostCenterInput) {
  const costCenter = await prisma.costCenter.create({
    data: {
      organizationId,
      code: upper(input.code)!,
      name: upper(input.name)!,
      description: upper(input.description),
    },
    include: costCenterInclude,
  });

  await recordAudit({
    organizationId,
    userId: actorId,
    action: "CREATE",
    entityType: "COST_CENTER",
    entityId: costCenter.id,
    summary: `Creó el centro de costo ${costCenter.code}`,
    after: costCenter,
  });
  return costCenter;
}

export async function updateCostCenter(
  organizationId: string,
  actorId: string,
  id: string,
  input: UpdateCostCenterInput,
) {
  const previous = await prisma.costCenter.findFirst({ where: { id, organizationId } });
  if (!previous) {
    const error = new Error("Centro de costo no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const costCenter = await prisma.costCenter.update({
    where: { id },
    data: {
      code: input.code === undefined ? undefined : upper(input.code),
      name: input.name === undefined ? undefined : upper(input.name),
      description: input.description === undefined ? undefined : upper(input.description) ?? null,
      isActive: input.isActive,
    },
    include: costCenterInclude,
  });
  await recordAudit({
    organizationId,
    userId: actorId,
    action: "UPDATE",
    entityType: "COST_CENTER",
    entityId: id,
    summary: `Actualizó el centro de costo ${costCenter.code}`,
    before: previous,
    after: costCenter,
  });
  return costCenter;
}

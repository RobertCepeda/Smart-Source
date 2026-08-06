import { prisma } from "./prisma";

type AuditInput = {
  organizationId: string;
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "STATUS_CHANGE" | "RECEIVE" | "INVENTORY_IN" | "INVENTORY_OUT";
  entityType: string;
  entityId?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

function jsonValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

export async function recordAudit(input: AuditInput, client: any = prisma) {
  const actor = input.userId
    ? await client.user.findUnique({ where: { id: input.userId }, select: { name: true, email: true } })
    : null;
  return client.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? undefined,
      actorName: actor?.name,
      actorEmail: actor?.email,
      action: input.action,
      entity: input.entityType,
      entityId: input.entityId ?? undefined,
      summary: input.summary,
      metadata: jsonValue({
        before: input.before,
        after: input.after,
        ...(typeof input.metadata === "object" && input.metadata ? input.metadata : { detail: input.metadata }),
      }),
    },
  });
}

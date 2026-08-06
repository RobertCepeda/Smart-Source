import { prisma } from "../../lib/prisma";
import { recordAudit } from "../../lib/audit";
import type { createContactSchema, updateContactSchema } from "./contact.schema";
import type { z } from "zod";

type CreateContactInput = z.infer<typeof createContactSchema>;
type UpdateContactInput = z.infer<typeof updateContactSchema>;

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function upperString(value?: string | null) {
  return cleanString(value)?.toLocaleUpperCase("es");
}

function contactData(input: Partial<CreateContactInput>) {
  return {
    name: upperString(input.name),
    role: upperString(input.role),
    phone: upperString(input.phone),
    whatsapp: upperString(input.whatsapp),
    email: upperString(input.email),
    isPrimary: input.isPrimary,
  };
}

async function ensureSupplier(organizationId: string, supplierId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId, isActive: true },
  });

  if (!supplier) {
    const error = new Error("Suplidor no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return supplier;
}

async function getContactOrThrow(organizationId: string, id: string) {
  const contact = await prisma.contact.findFirst({
    where: {
      id,
      supplier: {
        organizationId,
        isActive: true,
      },
    },
  });

  if (!contact) {
    const error = new Error("Contacto no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return contact;
}

export async function createContactForSupplier(organizationId: string, actorId: string, supplierId: string, input: CreateContactInput) {
  const supplier = await ensureSupplier(organizationId, supplierId);

  if (input.isPrimary) {
    await prisma.contact.updateMany({
      where: { supplierId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      supplierId,
      name: upperString(input.name)!,
      role: upperString(input.role),
      phone: upperString(input.phone),
      whatsapp: upperString(input.whatsapp),
      email: upperString(input.email),
      isPrimary: input.isPrimary ?? false,
    },
  });
  await recordAudit({ organizationId, userId: actorId, action: "CREATE", entityType: "CONTACT", entityId: contact.id, summary: `Creó el contacto ${contact.name} de ${supplier.name}`, after: contact });
  return contact;
}

export async function updateContact(organizationId: string, actorId: string, id: string, input: UpdateContactInput) {
  const contact = await getContactOrThrow(organizationId, id);

  if (input.isPrimary) {
    await prisma.contact.updateMany({
      where: { supplierId: contact.supplierId },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: contactData(input),
  });
  await recordAudit({ organizationId, userId: actorId, action: "UPDATE", entityType: "CONTACT", entityId: id, summary: `Actualizó el contacto ${updated.name}`, before: contact, after: updated });
  return updated;
}

export async function deleteContact(organizationId: string, actorId: string, id: string) {
  const contact = await getContactOrThrow(organizationId, id);
  await prisma.contact.delete({ where: { id } });
  await recordAudit({ organizationId, userId: actorId, action: "DELETE", entityType: "CONTACT", entityId: id, summary: `Eliminó el contacto ${contact.name}`, before: contact });
}

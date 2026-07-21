import { prisma } from "../../lib/prisma";
import type { createContactSchema, updateContactSchema } from "./contact.schema";
import type { z } from "zod";

type CreateContactInput = z.infer<typeof createContactSchema>;
type UpdateContactInput = z.infer<typeof updateContactSchema>;

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function contactData(input: Partial<CreateContactInput>) {
  return {
    name: cleanString(input.name),
    role: cleanString(input.role),
    phone: cleanString(input.phone),
    whatsapp: cleanString(input.whatsapp),
    email: cleanString(input.email),
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

export async function createContactForSupplier(organizationId: string, supplierId: string, input: CreateContactInput) {
  await ensureSupplier(organizationId, supplierId);

  if (input.isPrimary) {
    await prisma.contact.updateMany({
      where: { supplierId },
      data: { isPrimary: false },
    });
  }

  return prisma.contact.create({
    data: {
      supplierId,
      name: input.name.trim(),
      role: cleanString(input.role),
      phone: cleanString(input.phone),
      whatsapp: cleanString(input.whatsapp),
      email: cleanString(input.email),
      isPrimary: input.isPrimary ?? false,
    },
  });
}

export async function updateContact(organizationId: string, id: string, input: UpdateContactInput) {
  const contact = await getContactOrThrow(organizationId, id);

  if (input.isPrimary) {
    await prisma.contact.updateMany({
      where: { supplierId: contact.supplierId },
      data: { isPrimary: false },
    });
  }

  return prisma.contact.update({
    where: { id },
    data: contactData(input),
  });
}

export async function deleteContact(organizationId: string, id: string) {
  await getContactOrThrow(organizationId, id);
  await prisma.contact.delete({ where: { id } });
}

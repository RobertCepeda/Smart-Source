import { prisma } from "../../lib/prisma";
import type { createSupplierSchema, supplierQuerySchema, updateSupplierSchema } from "./supplier.schema";
import type { z } from "zod";

type SupplierCreateInput = z.infer<typeof createSupplierSchema>;
type SupplierUpdateInput = z.infer<typeof updateSupplierSchema>;
type SupplierQuery = z.infer<typeof supplierQuerySchema>;

const supplierSelect = {
  id: true,
  name: true,
  rnc: true,
  category: true,
  city: true,
  address: true,
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
  instagram: true,
  facebook: true,
  notes: true,
  rating: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  contacts: {
    orderBy: [{ isPrimary: "desc" as const }, { name: "asc" as const }],
  },
  tags: {
    include: { tag: true },
  },
  items: {
    include: { item: true },
  },
};

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function cleanUrl(value?: string | null) {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function supplierData(input: Partial<SupplierCreateInput>) {
  return {
    name: cleanString(input.name),
    rnc: cleanString(input.rnc),
    category: cleanString(input.category),
    city: cleanString(input.city),
    address: cleanString(input.address),
    phone: cleanString(input.phone),
    whatsapp: cleanString(input.whatsapp),
    email: cleanString(input.email),
    website: cleanUrl(input.website),
    instagram: cleanString(input.instagram),
    facebook: cleanString(input.facebook),
    notes: cleanString(input.notes),
    rating: input.rating,
  };
}

function mapSupplier(supplier: any) {
  return {
    id: supplier.id,
    name: supplier.name,
    rnc: supplier.rnc,
    category: supplier.category,
    city: supplier.city,
    address: supplier.address,
    phone: supplier.phone,
    whatsapp: supplier.whatsapp,
    email: supplier.email,
    website: supplier.website,
    instagram: supplier.instagram,
    facebook: supplier.facebook,
    notes: supplier.notes,
    rating: supplier.rating,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    contacts: supplier.contacts,
    tags: supplier.tags.map((item: any) => item.tag.name),
    catalogItems: supplier.items.map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      type: item.item.type,
      unit: item.item.unit,
      lastPrice: item.lastPrice?.toString() ?? null,
      currency: item.currency,
      leadTimeDays: item.leadTimeDays,
    })),
  };
}

async function getSupplierOrThrow(organizationId: string, id: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId, isActive: true },
    select: supplierSelect,
  });

  if (!supplier) {
    const error = new Error("Suplidor no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return supplier;
}

function uniqueValues(values?: string[]) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

async function syncTags(tx: any, supplierId: string, tags?: string[]) {
  if (!tags) {
    return;
  }

  await tx.supplierTag.deleteMany({ where: { supplierId } });

  for (const name of uniqueValues(tags)) {
    const tag = await tx.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    await tx.supplierTag.create({
      data: { supplierId, tagId: tag.id },
    });
  }
}

async function syncCatalogItems(
  tx: any,
  organizationId: string,
  supplierId: string,
  catalogItems?: SupplierCreateInput["catalogItems"],
) {
  if (!catalogItems) {
    return;
  }

  await tx.supplierItem.deleteMany({ where: { supplierId } });

  for (const catalogItem of catalogItems) {
    const name = catalogItem.name.trim();
    const item =
      (await tx.item.findFirst({
        where: { organizationId, name: { equals: name, mode: "insensitive" }, type: catalogItem.type },
      })) ??
      (await tx.item.create({
        data: {
          organizationId,
          name,
          type: catalogItem.type,
          unit: cleanString(catalogItem.unit),
        },
      }));

    await tx.supplierItem.create({
      data: {
        supplierId,
        itemId: item.id,
        lastPrice: typeof catalogItem.lastPrice === "number" ? catalogItem.lastPrice.toString() : undefined,
      },
    });
  }
}

async function syncContacts(tx: any, supplierId: string, contacts?: SupplierCreateInput["contacts"]) {
  if (!contacts) {
    return;
  }

  await tx.contact.deleteMany({ where: { supplierId } });

  if (!contacts.length) {
    return;
  }

  await tx.contact.createMany({
    data: contacts.map((contact, index) => ({
      supplierId,
      name: contact.name.trim(),
      role: cleanString(contact.role),
      phone: cleanString(contact.phone),
      whatsapp: cleanString(contact.whatsapp),
      email: cleanString(contact.email),
      isPrimary: contact.isPrimary ?? index === 0,
    })),
  });
}

export async function listSuppliers(organizationId: string, query: SupplierQuery) {
  const search = cleanString(query.search);

  const suppliers = await prisma.supplier.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(cleanString(query.category) ? { category: { contains: query.category, mode: "insensitive" as const } } : {}),
      ...(cleanString(query.city) ? { city: { contains: query.city, mode: "insensitive" as const } } : {}),
      ...(cleanString(query.tag)
        ? {
            tags: {
              some: { tag: { name: { contains: query.tag, mode: "insensitive" as const } } },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { rnc: { contains: search, mode: "insensitive" as const } },
              { category: { contains: search, mode: "insensitive" as const } },
              { city: { contains: search, mode: "insensitive" as const } },
              { address: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { whatsapp: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { website: { contains: search, mode: "insensitive" as const } },
              { notes: { contains: search, mode: "insensitive" as const } },
              { contacts: { some: { name: { contains: search, mode: "insensitive" as const } } } },
              { contacts: { some: { role: { contains: search, mode: "insensitive" as const } } } },
              { contacts: { some: { phone: { contains: search, mode: "insensitive" as const } } } },
              { contacts: { some: { whatsapp: { contains: search, mode: "insensitive" as const } } } },
              { contacts: { some: { email: { contains: search, mode: "insensitive" as const } } } },
              { items: { some: { item: { name: { contains: search, mode: "insensitive" as const } } } } },
              { items: { some: { item: { unit: { contains: search, mode: "insensitive" as const } } } } },
              { tags: { some: { tag: { name: { contains: search, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    select: supplierSelect,
  });

  return suppliers.map(mapSupplier);
}

export async function getSupplierById(organizationId: string, id: string) {
  return mapSupplier(await getSupplierOrThrow(organizationId, id));
}

export async function createSupplier(organizationId: string, input: SupplierCreateInput) {
  const supplier = await prisma.$transaction(async (tx) => {
    const created = await tx.supplier.create({
      data: {
        ...supplierData(input),
        name: input.name.trim(),
        organizationId,
      },
    });

    await syncContacts(tx, created.id, input.contacts);
    await syncTags(tx, created.id, input.tags);
    await syncCatalogItems(tx, organizationId, created.id, input.catalogItems);

    return tx.supplier.findUniqueOrThrow({
      where: { id: created.id },
      select: supplierSelect,
    });
  });

  return mapSupplier(supplier);
}

export async function updateSupplier(organizationId: string, id: string, input: SupplierUpdateInput) {
  await getSupplierOrThrow(organizationId, id);

  const supplier = await prisma.$transaction(async (tx) => {
    await tx.supplier.update({
      where: { id },
      data: supplierData(input),
    });

    await syncContacts(tx, id, input.contacts);
    await syncTags(tx, id, input.tags);
    await syncCatalogItems(tx, organizationId, id, input.catalogItems);

    return tx.supplier.findUniqueOrThrow({
      where: { id },
      select: supplierSelect,
    });
  });

  return mapSupplier(supplier);
}

export async function deactivateSupplier(organizationId: string, id: string) {
  await getSupplierOrThrow(organizationId, id);

  await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });
}

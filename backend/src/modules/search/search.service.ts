import { prisma } from "../../lib/prisma";

type SearchResult = {
  id: string;
  type: "supplier" | "contact" | "item" | "category" | "brand" | "tag";
  title: string;
  subtitle: string;
  description: string | null;
  path: string;
  meta: string[];
};

type SearchGroup = {
  key: "suppliers" | "contacts" | "catalog" | "categories" | "brands" | "tags";
  label: string;
  count: number;
  results: SearchResult[];
};

const TAKE = 6;

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function contains(search: string) {
  return { contains: search, mode: "insensitive" as const };
}

function supplierSummary(supplier: { city: string | null; category: string | null }) {
  return compact([supplier.city || "Sin ciudad", supplier.category || "Sin categoría"]).join(" - ");
}

export async function globalSearch(organizationId: string, rawQuery: string) {
  const query = rawQuery.trim();

  if (query.length < 2) {
    return {
      query,
      total: 0,
      groups: emptyGroups(),
    };
  }

  const [
    suppliers,
    contacts,
    items,
    categories,
    brands,
    tags,
  ] = await Promise.all([
    prisma.supplier.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: contains(query) },
          { rnc: contains(query) },
          { category: contains(query) },
          { city: contains(query) },
          { email: contains(query) },
          { contacts: { some: { name: contains(query) } } },
          { items: { some: { item: { name: contains(query) } } } },
          { tags: { some: { tag: { name: contains(query) } } } },
        ],
      },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        email: true,
        phone: true,
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          take: 1,
          select: { name: true },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        supplier: { organizationId, isActive: true },
        OR: [
          { name: contains(query) },
          { role: contains(query) },
          { phone: contains(query) },
          { whatsapp: contains(query) },
          { email: contains(query) },
        ],
      },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        supplier: {
          select: {
            id: true,
            name: true,
            city: true,
            category: true,
          },
        },
      },
    }),
    prisma.item.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: contains(query) },
          { unit: contains(query) },
          { description: contains(query) },
          { category: { name: contains(query) } },
          { brand: { name: contains(query) } },
        ],
      },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        type: true,
        unit: true,
        description: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        _count: { select: { suppliers: true } },
      },
    }),
    prisma.category.findMany({
      where: { organizationId, name: contains(query) },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.brand.findMany({
      where: { organizationId, name: contains(query) },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.tag.findMany({
      where: {
        name: contains(query),
        suppliers: {
          some: {
            supplier: { organizationId, isActive: true },
          },
        },
      },
      orderBy: { name: "asc" },
      take: TAKE,
      select: {
        id: true,
        name: true,
        suppliers: {
          where: { supplier: { organizationId, isActive: true } },
          select: { supplierId: true },
        },
      },
    }),
  ]);

  const groups: SearchGroup[] = [
    {
      key: "suppliers",
      label: "Suplidores",
      count: suppliers.length,
      results: suppliers.map((supplier) => ({
        id: supplier.id,
        type: "supplier",
        title: supplier.name,
        subtitle: supplierSummary(supplier),
        description: compact([supplier.contacts[0]?.name, supplier.email, supplier.phone]).join(" - ") || null,
        path: `/suppliers/${supplier.id}`,
        meta: compact(["Suplidor", supplier.category, supplier.city]),
      })),
    },
    {
      key: "contacts",
      label: "Contactos",
      count: contacts.length,
      results: contacts.map((contact) => ({
        id: contact.id,
        type: "contact",
        title: contact.name,
        subtitle: `Contacto en ${contact.supplier.name}`,
        description: compact([contact.role, contact.email, contact.phone]).join(" - ") || null,
        path: `/suppliers/${contact.supplier.id}`,
        meta: compact(["Contacto", contact.supplier.city, contact.supplier.category]),
      })),
    },
    {
      key: "catalog",
      label: "Catálogo",
      count: items.length,
      results: items.map((item) => ({
        id: item.id,
        type: "item",
        title: item.name,
        subtitle: item.type === "MATERIAL" ? "Material" : "Servicio",
        description: compact([item.description, item.category?.name, item.brand?.name, item.unit]).join(" - ") || null,
        path: `/catalog/${item.id}`,
        meta: [`${item._count.suppliers} supl.`, item.type === "MATERIAL" ? "Material" : "Servicio"],
      })),
    },
    {
      key: "categories",
      label: "Categorias",
      count: categories.length,
      results: categories.map((category) => ({
        id: category.id,
        type: "category",
        title: category.name,
        subtitle: "Categoría de catálogo",
        description: `${category._count.items} items relacionados`,
        path: "/catalog",
        meta: ["Categoria"],
      })),
    },
    {
      key: "brands",
      label: "Marcas",
      count: brands.length,
      results: brands.map((brand) => ({
        id: brand.id,
        type: "brand",
        title: brand.name,
        subtitle: "Marca de catálogo",
        description: `${brand._count.items} items relacionados`,
        path: "/catalog",
        meta: ["Marca"],
      })),
    },
    {
      key: "tags",
      label: "Etiquetas",
      count: tags.length,
      results: tags.map((tag) => ({
        id: tag.id,
        type: "tag",
        title: tag.name,
        subtitle: "Etiqueta de suplidores",
        description: `${tag.suppliers.length} suplidores relacionados`,
        path: `/suppliers?search=${encodeURIComponent(tag.name)}`,
        meta: ["Etiqueta"],
      })),
    },
  ];

  return {
    query,
    total: groups.reduce((sum, group) => sum + group.count, 0),
    groups,
  };
}

function emptyGroups(): SearchGroup[] {
  return [
    { key: "suppliers", label: "Suplidores", count: 0, results: [] },
    { key: "contacts", label: "Contactos", count: 0, results: [] },
    { key: "catalog", label: "Catálogo", count: 0, results: [] },
    { key: "categories", label: "Categorias", count: 0, results: [] },
    { key: "brands", label: "Marcas", count: 0, results: [] },
    { key: "tags", label: "Etiquetas", count: 0, results: [] },
  ];
}

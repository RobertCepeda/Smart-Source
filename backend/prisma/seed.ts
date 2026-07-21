import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplierItem.deleteMany();
  await prisma.supplierTag.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.tag.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: "Organización Prueba 01",
      slug: "organizacion-prueba-01",
      billingEmail: "prueba01@gmail.com",
      accountType: "BUSINESS",
      plan: "BUSINESS",
    },
  });

  const adminOrganization = await prisma.organization.create({
    data: {
      name: "Smart Source Admin",
      slug: "smart-source-admin",
      billingEmail: "admin@smartsource.local",
      accountType: "BUSINESS",
      plan: "INTERNAL",
    },
  });

  const [construction, electrical, office, technology, services] = await Promise.all(
    ["Construcción", "Eléctrico", "Oficina", "Tecnología", "Servicios"].map((name) =>
      prisma.category.create({ data: { name, organizationId: organization.id } }),
    ),
  );

  const [acme, delta, nexans, truper] = await Promise.all(
    ["Acme", "Delta", "Nexans", "Truper"].map((name) => prisma.brand.create({ data: { name, organizationId: organization.id } })),
  );

  const [urgent, credit, certified, local, importTag] = await Promise.all(
    ["Urgente", "Crédito", "Certificado", "Local", "Importación"].map((name) =>
      prisma.tag.create({ data: { name } }),
    ),
  );

  await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: "Usuario Prueba",
      email: "prueba01@gmail.com",
      company: organization.name,
      passwordHash: await bcrypt.hash("12345678", 12),
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      organizationId: adminOrganization.id,
      name: "Administrador Smart Source",
      email: "admin@smartsource.local",
      company: adminOrganization.name,
      passwordHash: await bcrypt.hash("12345678", 12),
      role: "SYSTEM_ADMIN",
    },
  });

  const cement = await prisma.item.create({
    data: {
      name: "Cemento gris",
      organizationId: organization.id,
      type: "MATERIAL",
      unit: "funda",
      categoryId: construction.id,
      brandId: acme.id,
      description: "Cemento para obras generales.",
    },
  });

  const cable = await prisma.item.create({
    data: {
      name: "Cable electrico THHN 12",
      organizationId: organization.id,
      type: "MATERIAL",
      unit: "metro",
      categoryId: electrical.id,
      brandId: nexans.id,
    },
  });

  const laptops = await prisma.item.create({
    data: {
      name: "Laptop empresarial",
      organizationId: organization.id,
      type: "MATERIAL",
      unit: "unidad",
      categoryId: technology.id,
      brandId: delta.id,
    },
  });

  const stationery = await prisma.item.create({
    data: {
      name: "Material gastable",
      organizationId: organization.id,
      type: "MATERIAL",
      unit: "caja",
      categoryId: office.id,
    },
  });

  const maintenance = await prisma.item.create({
    data: {
      name: "Mantenimiento preventivo",
      organizationId: organization.id,
      type: "SERVICIO",
      unit: "hora",
      categoryId: services.id,
      brandId: truper.id,
    },
  });

  await prisma.supplier.create({
    data: {
      name: "Ferreteria Central",
      organizationId: organization.id,
      rnc: "101234567",
      category: "Construccion",
      city: "Santo Domingo",
      address: "Av. John F. Kennedy 120",
      phone: "809-555-0101",
      whatsapp: "18095550101",
      email: "ventas@ferreteriacentral.local",
      website: "https://ferreteriacentral.local",
      rating: 4,
      notes: "Buen inventario para compras urgentes.",
      contacts: {
        create: [
          {
            name: "Carlos Medina",
            role: "Vendedor",
            phone: "809-555-0111",
            whatsapp: "18095550111",
            email: "carlos@ferreteriacentral.local",
            isPrimary: true,
          },
        ],
      },
      items: {
        create: [
          { itemId: cement.id, lastPrice: "425.00", leadTimeDays: 1 },
          { itemId: maintenance.id, lastPrice: "950.00", leadTimeDays: 2 },
        ],
      },
      tags: {
        create: [{ tagId: urgent.id }, { tagId: local.id }],
      },
    },
  });

  await prisma.supplier.create({
    data: {
      name: "Electro Caribe",
      organizationId: organization.id,
      rnc: "101765432",
      category: "Electrico",
      city: "Santiago",
      phone: "809-555-0202",
      whatsapp: "18095550202",
      email: "cotizaciones@electrocaribe.local",
      rating: 5,
      contacts: {
        create: [
          {
            name: "Laura Perez",
            role: "Ejecutiva de cuentas",
            phone: "809-555-0222",
            whatsapp: "18095550222",
            email: "laura@electrocaribe.local",
            isPrimary: true,
          },
        ],
      },
      items: {
        create: [{ itemId: cable.id, lastPrice: "38.50", leadTimeDays: 3 }],
      },
      tags: {
        create: [{ tagId: certified.id }, { tagId: credit.id }],
      },
    },
  });

  await prisma.supplier.create({
    data: {
      name: "OfiMax Dominicana",
      organizationId: organization.id,
      rnc: "130998877",
      category: "Oficina",
      city: "Santo Domingo",
      phone: "809-555-0303",
      email: "servicio@ofimax.local",
      rating: 4,
      contacts: {
        create: [
          {
            name: "Marta Rojas",
            role: "Servicio al cliente",
            phone: "809-555-0333",
            email: "marta@ofimax.local",
            isPrimary: true,
          },
        ],
      },
      items: {
        create: [{ itemId: stationery.id, lastPrice: "1850.00", leadTimeDays: 1 }],
      },
      tags: {
        create: [{ tagId: credit.id }, { tagId: local.id }],
      },
    },
  });

  await prisma.supplier.create({
    data: {
      name: "TechNova Supply",
      organizationId: organization.id,
      rnc: "132222111",
      category: "Tecnologia",
      city: "Punta Cana",
      phone: "809-555-0404",
      whatsapp: "18095550404",
      email: "sales@technova.local",
      website: "https://technova.local",
      rating: 5,
      contacts: {
        create: [
          {
            name: "Victor Santos",
            role: "Gerente comercial",
            phone: "809-555-0444",
            whatsapp: "18095550444",
            email: "victor@technova.local",
            isPrimary: true,
          },
        ],
      },
      items: {
        create: [{ itemId: laptops.id, lastPrice: "58500.00", leadTimeDays: 7 }],
      },
      tags: {
        create: [{ tagId: importTag.id }, { tagId: certified.id }],
      },
    },
  });

  await prisma.supplier.create({
    data: {
      name: "Servicios Industriales Norte",
      organizationId: organization.id,
      rnc: "124440001",
      category: "Servicios",
      city: "La Vega",
      phone: "809-555-0505",
      email: "operaciones@sinorte.local",
      rating: 3,
      contacts: {
        create: [
          {
            name: "Ana Mendez",
            role: "Coordinadora",
            phone: "809-555-0555",
            email: "ana@sinorte.local",
            isPrimary: true,
          },
        ],
      },
      items: {
        create: [{ itemId: maintenance.id, lastPrice: "875.00", leadTimeDays: 2 }],
      },
      tags: {
        create: [{ tagId: local.id }],
      },
    },
  });

  await prisma.supportTicket.create({
    data: {
      organizationId: organization.id,
      subject: "Bienvenida a Centro de Atención",
      category: "SOPORTE",
      priority: "NORMAL",
      messages: {
        create: [
          {
            authorType: "AUTOMATICO",
            body: "Tu buzón de soporte está listo. Desde aquí podrás enviarnos dudas, solicitudes de mantenimiento e ideas.",
          },
        ],
      },
    },
  });

  console.log("Seed completed with prueba01@gmail.com, admin portal user, catalog, support center, and 5 suppliers.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

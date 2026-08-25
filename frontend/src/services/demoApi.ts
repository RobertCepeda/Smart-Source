import type {
  AdminOverview,
  AiChatDetail,
  AiChatSummary,
  AiDocumentDetail,
  AiDocumentSummary,
  AiQuestionAnswer,
  AuthResponse,
  AuthUser,
  CatalogEntity,
  CatalogFilters,
  CatalogItem,
  CatalogItemDetailResponse,
  CatalogItemPayload,
  CatalogSubcategory,
  CostCenter,
  HealthResponse,
  OrganizationWorkspaceResponse,
  AuditLog,
  PriceHistoryResponse,
  PricePoint,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderPayload,
  QuoteComparison,
  QuoteRequest,
  QuoteRequestEmailLog,
  QuoteRequestFilters,
  QuoteRequestPayload,
  QuoteRequestSupplier,
  ReportsSummaryResponse,
  SmartSearchResponse,
  Supplier,
  SupplierFilters,
  SupplierPayload,
  SupplierQuote,
  SupplierQuoteLine,
  SupportTicket,
  UnitOfMeasure,
  Warehouse,
  InventoryTransfer,
} from "./api";

export const demoToken = "smart-source-static-demo-token";

const now = "2026-07-21T12:00:00.000Z";

const organization = {
  id: "org_demo",
  name: "Organización Prueba 01",
  slug: "organizacion-prueba-01",
  billingEmail: "prueba01@gmail.com",
  status: "ACTIVE" as const,
  accountType: "BUSINESS" as const,
  plan: "BUSINESS",
  createdAt: now,
  updatedAt: now,
};

export const demoUser: AuthUser = {
  id: "user_demo",
  organizationId: organization.id,
  organization: {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    accountType: organization.accountType,
    plan: organization.plan,
  },
  name: "Usuario Prueba",
  email: "prueba01@gmail.com",
  company: organization.name,
  avatarUrl: null,
  authProvider: "EMAIL",
  role: "ADMIN",
};

const categories: CatalogEntity[] = [
  { id: "cat_construction", name: "Construcción" },
  { id: "cat_electrical", name: "Eléctrico" },
  { id: "cat_office", name: "Oficina" },
  { id: "cat_tech", name: "Tecnología" },
  { id: "cat_services", name: "Servicios" },
];

const subcategories: CatalogSubcategory[] = [
  { id: "sub_concrete", categoryId: "cat_construction", name: "HORMIGÓN Y CEMENTO", category: categories[0] },
  { id: "sub_wiring", categoryId: "cat_electrical", name: "CABLEADO", category: categories[1] },
  { id: "sub_computers", categoryId: "cat_tech", name: "COMPUTADORAS", category: categories[3] },
  { id: "sub_maintenance", categoryId: "cat_services", name: "MANTENIMIENTO", category: categories[4] },
];

const brands: CatalogEntity[] = [
  { id: "brand_acme", name: "Acme" },
  { id: "brand_delta", name: "Delta" },
  { id: "brand_nexans", name: "Nexans" },
  { id: "brand_truper", name: "Truper" },
];

let units: UnitOfMeasure[] = [
  "unidad",
  "metro",
  "centímetro",
  "milímetro",
  "pie",
  "pulgada",
  "metro cuadrado",
  "metro cúbico",
  "kilogramo",
  "libra",
  "tonelada",
  "litro",
  "galón",
  "funda",
  "saco",
  "caja",
  "paquete",
  "rollo",
  "tubo",
  "varilla",
  "plancha",
  "par",
  "juego",
  "lote",
  "servicio",
  "hora",
  "día",
  "semana",
  "mes",
  "viaje",
].map((name) => makeUnit(name));

let quoteRequestDraft: { id: string; payload: any; createdAt: string; updatedAt: string } | null = null;

let catalogItems: CatalogItem[] = [
  makeItem("item_cement", "Cemento gris", "MATERIAL", "funda", "cat_construction", "brand_acme", 1),
  makeItem("item_cable", "Cable eléctrico THHN 12", "MATERIAL", "metro", "cat_electrical", "brand_nexans", 1),
  makeItem("item_laptop", "Laptop empresarial", "MATERIAL", "unidad", "cat_tech", "brand_delta", 1),
  makeItem("item_stationery", "Material gastable", "MATERIAL", "caja", "cat_office", null, 1),
  makeItem("item_maintenance", "Mantenimiento preventivo", "SERVICIO", "hora", "cat_services", "brand_truper", 2),
];

let suppliers: Supplier[] = [
  {
    id: "sup_ferreteria",
    name: "Ferretería Central",
    rnc: "101234567",
    category: "Construcción",
    city: "Santo Domingo",
    address: "Av. John F. Kennedy 120",
    phone: "809-555-0101",
    whatsapp: "18095550101",
    email: "ventas@ferreteriacentral.local",
    website: "https://ferreteriacentral.local",
    instagram: null,
    facebook: null,
    notes: "Buen inventario para compras urgentes.",
    rating: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    contacts: [
      {
        id: "contact_carlos",
        supplierId: "sup_ferreteria",
        name: "Carlos Medina",
        role: "Vendedor",
        phone: "809-555-0111",
        whatsapp: "18095550111",
        email: "carlos@ferreteriacentral.local",
        isPrimary: true,
      },
    ],
    tags: ["Urgente", "Local"],
    catalogItems: [
      { id: "item_cement", name: "Cemento gris", type: "MATERIAL", unit: "funda", lastPrice: "425.00", currency: "DOP", leadTimeDays: 1 },
      { id: "item_maintenance", name: "Mantenimiento preventivo", type: "SERVICIO", unit: "hora", lastPrice: "950.00", currency: "DOP", leadTimeDays: 2 },
    ],
  },
  {
    id: "sup_electro",
    name: "Electro Caribe",
    rnc: "101765432",
    category: "Eléctrico",
    city: "Santiago",
    address: null,
    phone: "809-555-0202",
    whatsapp: "18095550202",
    email: "cotizaciones@electrocaribe.local",
    website: null,
    instagram: null,
    facebook: null,
    notes: null,
    rating: 5,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    contacts: [
      {
        id: "contact_laura",
        supplierId: "sup_electro",
        name: "Laura Pérez",
        role: "Ejecutiva de cuentas",
        phone: "809-555-0222",
        whatsapp: "18095550222",
        email: "laura@electrocaribe.local",
        isPrimary: true,
      },
    ],
    tags: ["Certificado", "Crédito"],
    catalogItems: [
      { id: "item_cable", name: "Cable eléctrico THHN 12", type: "MATERIAL", unit: "metro", lastPrice: "38.50", currency: "DOP", leadTimeDays: 3 },
    ],
  },
  {
    id: "sup_ofimax",
    name: "OfiMax Dominicana",
    rnc: "130998877",
    category: "Oficina",
    city: "Santo Domingo",
    address: null,
    phone: "809-555-0303",
    whatsapp: null,
    email: "servicio@ofimax.local",
    website: null,
    instagram: null,
    facebook: null,
    notes: null,
    rating: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    contacts: [
      {
        id: "contact_marta",
        supplierId: "sup_ofimax",
        name: "Marta Rojas",
        role: "Servicio al cliente",
        phone: "809-555-0333",
        whatsapp: null,
        email: "marta@ofimax.local",
        isPrimary: true,
      },
    ],
    tags: ["Crédito", "Local"],
    catalogItems: [
      { id: "item_stationery", name: "Material gastable", type: "MATERIAL", unit: "caja", lastPrice: "1850.00", currency: "DOP", leadTimeDays: 1 },
    ],
  },
  {
    id: "sup_technova",
    name: "TechNova Supply",
    rnc: "132222111",
    category: "Tecnología",
    city: "Punta Cana",
    address: null,
    phone: "809-555-0404",
    whatsapp: "18095550404",
    email: "sales@technova.local",
    website: "https://technova.local",
    instagram: null,
    facebook: null,
    notes: null,
    rating: 5,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    contacts: [
      {
        id: "contact_victor",
        supplierId: "sup_technova",
        name: "Víctor Santos",
        role: "Gerente comercial",
        phone: "809-555-0444",
        whatsapp: "18095550444",
        email: "victor@technova.local",
        isPrimary: true,
      },
    ],
    tags: ["Importación", "Certificado"],
    catalogItems: [
      { id: "item_laptop", name: "Laptop empresarial", type: "MATERIAL", unit: "unidad", lastPrice: "58500.00", currency: "DOP", leadTimeDays: 7 },
    ],
  },
  {
    id: "sup_servicios_norte",
    name: "Servicios Industriales Norte",
    rnc: "124440001",
    category: "Servicios",
    city: "La Vega",
    address: null,
    phone: "809-555-0505",
    whatsapp: null,
    email: "operaciones@sinorte.local",
    website: null,
    instagram: null,
    facebook: null,
    notes: null,
    rating: 3,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    contacts: [
      {
        id: "contact_ana",
        supplierId: "sup_servicios_norte",
        name: "Ana Méndez",
        role: "Coordinadora",
        phone: "809-555-0555",
        whatsapp: null,
        email: "ana@sinorte.local",
        isPrimary: true,
      },
    ],
    tags: ["Local"],
    catalogItems: [
      { id: "item_maintenance", name: "Mantenimiento preventivo", type: "SERVICIO", unit: "hora", lastPrice: "875.00", currency: "DOP", leadTimeDays: 2 },
    ],
  },
];

const pricePoints: PricePoint[] = [
  point("ph_cable_1", "item_cable", "Cable eléctrico THHN 12", "sup_electro", "Electro Caribe", 38.5, "Orden OC-2026-001"),
  point("ph_cement_1", "item_cement", "Cemento gris", "sup_ferreteria", "Ferretería Central", 425, "Orden OC-2026-002"),
  point("ph_stationery_1", "item_stationery", "Material gastable", "sup_ofimax", "OfiMax Dominicana", 1850, "Orden OC-2026-003"),
  point("ph_laptop_1", "item_laptop", "Laptop empresarial", "sup_technova", "TechNova Supply", 58500, "Orden OC-2026-004"),
  point("ph_maintenance_1", "item_maintenance", "Mantenimiento preventivo", "sup_ferreteria", "Ferretería Central", 950, "Orden OC-2026-005"),
  point("ph_maintenance_2", "item_maintenance", "Mantenimiento preventivo", "sup_servicios_norte", "Servicios Industriales Norte", 875, "Cotización"),
];

let purchaseOrders: PurchaseOrder[] = [
  makeOrder("po_1", "OC-2026-001", "sup_electro", "RECIBIDA", [{ itemId: "item_cable", quantity: 120, unitPrice: 38.5 }]),
  makeOrder("po_2", "OC-2026-002", "sup_ferreteria", "ENVIADA", [{ itemId: "item_cement", quantity: 25, unitPrice: 425 }]),
  makeOrder("po_3", "OC-2026-003", "sup_ofimax", "RECIBIDA", [{ itemId: "item_stationery", quantity: 3, unitPrice: 1850 }]),
  makeOrder("po_4", "OC-2026-004", "sup_technova", "BORRADOR", [{ itemId: "item_laptop", quantity: 2, unitPrice: 58500 }]),
  makeOrder("po_5", "OC-2026-005", "sup_ferreteria", "RECIBIDA", [{ itemId: "item_maintenance", quantity: 10, unitPrice: 950 }]),
];

let costCenters: CostCenter[] = [
  { id: "cc_204", code: "CC-204", name: "TORRE NORTE", description: "OBRA ELÉCTRICA Y CIVIL", isActive: true, createdAt: now, updatedAt: now, _count: { quoteRequests: 1, purchaseOrders: 0 } },
  { id: "cc_adm", code: "ADM-010", name: "ADMINISTRACIÓN", description: "OPERACIONES DE OFICINA", isActive: true, createdAt: now, updatedAt: now, _count: { quoteRequests: 1, purchaseOrders: 0 } },
];

let quoteRequests: QuoteRequest[] = [
  makeQuoteRequest("qr_1", "SC-2026-00001", "Torre Norte - Eléctrico", "CC-204", [
    { description: "Cable eléctrico THHN 12 rojo", quantity: 120, unit: "metro", technicalSpecs: "Certificación UL, cobre, color rojo." },
    { description: "Breaker 2 polos 40A", quantity: 6, unit: "unidad", technicalSpecs: "Compatible con panel existente." },
  ], [], demoUser.name, "2026-07-30", "Favor cotizar con tiempo de entrega y garantía.", ["sup_electro", "sup_ferreteria"]),
  makeQuoteRequest("qr_2", "SC-2026-00002", "Oficina principal", "ADM-010", [
    { description: "Material gastable mensual", quantity: 3, unit: "caja", technicalSpecs: "Papel, folders, lapiceros y etiquetas." },
  ], [], demoUser.name, "2026-07-28", "Compra recurrente para administración.", ["sup_ofimax"]),
];

let supportTickets: SupportTicket[] = [
  {
    id: "ticket_welcome",
    subject: "Bienvenida a Centro de Atención",
    category: "SOPORTE",
    priority: "NORMAL",
    status: "ABIERTO",
    createdAt: now,
    updatedAt: now,
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
    requester: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
    messages: [
      {
        id: "msg_welcome",
        authorType: "AUTOMATICO",
        body: "Tu buzón de soporte está listo. Desde aquí podrás enviarnos dudas, solicitudes de mantenimiento e ideas.",
        createdAt: now,
      },
    ],
  },
];

let warehouses: Warehouse[] = [
  {
    id: "warehouse_general",
    name: "ALMACÉN GENERAL",
    code: "AG-01",
    type: "GENERAL",
    location: "SEDE PRINCIPAL",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    balances: [
      { id: "balance_cable", itemId: "item_cable", quantity: "120.00", item: catalogItems[1] },
      { id: "balance_stationery", itemId: "item_stationery", quantity: "3.00", item: catalogItems[3] },
    ],
    movements: [],
    _count: { balances: 2, movements: 2, purchaseOrders: 2 },
  },
  {
    id: "warehouse_project",
    name: "ALMACÉN TORRE NORTE",
    code: "PR-01",
    type: "PROJECT",
    location: "PROYECTO TORRE NORTE",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    balances: [],
    movements: [],
    _count: { balances: 0, movements: 0, purchaseOrders: 0 },
  },
];

let inventoryTransfers: InventoryTransfer[] = [];

let auditLogs: AuditLog[] = [
  {
    id: "audit_demo",
    action: "CREATE",
    entityType: "ORGANIZATION",
    entityId: organization.id,
    summary: "Creó el espacio de trabajo de demostración",
    before: null,
    after: { name: organization.name },
    metadata: null,
    createdAt: now,
    user: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
  },
];

let aiDocuments: AiDocumentDetail[] = [
  {
    id: "ai_demo_doc",
    chatId: "chat_demo_today",
    fileName: "reporte-demo-compras.csv",
    mimeType: "text/csv",
    extension: "csv",
    sizeBytes: 148,
    summary: "Archivo demo leído como tabla. Contiene compras por producto, suplidor, cantidad y total.",
    createdAt: now,
    sheetCount: 1,
    rowCount: 3,
    questionCount: 1,
    extractedTextPreview:
      "producto,suplidor,cantidad,total\nCable eléctrico THHN 12,Electro Caribe,120,4620\nCemento gris,Ferretería Central,25,10625\nMaterial gastable,OfiMax Dominicana,3,5550",
    questions: [
      {
        id: "ai_q_1",
        question: "¿Cuál es el total comprado?",
        answer: "El total de las compras del documento demo es 20,795 DOP.",
        createdAt: now,
      },
    ],
  },
];

let aiChats: AiChatSummary[] = [
  {
    id: "chat_demo_today",
    title: "Chat de documentos",
    createdAt: now,
    updatedAt: now,
    documentCount: 1,
    questionCount: 1,
    recentFiles: ["reporte-demo-compras.csv"],
  },
];

let aiChatQuestions: Record<string, AiQuestionAnswer[]> = {
  chat_demo_today: aiDocuments[0].questions,
};

export const demoApi = {
  getHealth: () => ok<HealthResponse>({ app: "Smart Source", status: "ok", module: "static-demo" }),
  login: () => ok<AuthResponse>({ token: demoToken, user: demoUser }),
  register: () => ok<AuthResponse>({ token: demoToken, user: demoUser }),
  me: () => ok<{ user: AuthUser }>({ user: demoUser }),
  updateProfile: (payload: { name?: string; company?: string; avatarUrl?: string }) => {
    Object.assign(demoUser, {
      name: payload.name || demoUser.name,
      company: payload.company || demoUser.company,
      avatarUrl: payload.avatarUrl || demoUser.avatarUrl,
    });
    return ok<{ user: AuthUser }>({ user: demoUser });
  },
  listSuppliers: (filters: SupplierFilters = {}) =>
    ok({ suppliers: suppliers.filter((supplier) => supplierMatches(supplier, filters)) }),
  getSupplier: (id: string) => ok({ supplier: findSupplier(id) }),
  createSupplier: (payload: SupplierPayload) => {
    const id = `sup_${Date.now()}`;
    const supplier: Supplier = {
      id,
      name: payload.name,
      rnc: payload.rnc || null,
      category: categories.find((entry) => entry.id === payload.categoryId)?.name ?? null,
      subcategory: subcategories.find((entry) => entry.id === payload.subcategoryId)?.name ?? null,
      categoryId: payload.categoryId || null,
      subcategoryId: payload.subcategoryId || null,
      categoryRecord: categories.find((entry) => entry.id === payload.categoryId) ?? null,
      subcategoryRecord: subcategories.find((entry) => entry.id === payload.subcategoryId) ?? null,
      city: payload.city || null,
      address: payload.address || null,
      phone: payload.phone || null,
      whatsapp: payload.whatsapp || null,
      email: payload.email || null,
      website: payload.website || null,
      instagram: payload.instagram || null,
      facebook: payload.facebook || null,
      notes: payload.notes || null,
      rating: payload.rating ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      contacts: (payload.contacts ?? []).map((contact, index) => ({
        id: `${id}_contact_${index}`,
        supplierId: id,
        name: contact.name,
        role: contact.role || null,
        phone: contact.phone || null,
        whatsapp: contact.whatsapp || null,
        email: contact.email || null,
        isPrimary: Boolean(contact.isPrimary),
      })),
      tags: payload.tags ?? [],
      catalogItems: (payload.catalogItems ?? []).map((item, index) => ({
        id: `${id}_item_${index}`,
        name: item.name,
        type: item.type,
        unit: item.unit || null,
        lastPrice: item.lastPrice === "" || item.lastPrice === undefined ? null : String(item.lastPrice),
        currency: "DOP",
        leadTimeDays: null,
      })),
    };
    suppliers = [supplier, ...suppliers];
    return ok({ supplier });
  },
  updateSupplier: (id: string, payload: SupplierPayload) => {
    const current = findSupplier(id);
    Object.assign(current, {
      name: payload.name,
      rnc: payload.rnc || null,
      category: categories.find((entry) => entry.id === payload.categoryId)?.name ?? null,
      subcategory: subcategories.find((entry) => entry.id === payload.subcategoryId)?.name ?? null,
      categoryId: payload.categoryId || null,
      subcategoryId: payload.subcategoryId || null,
      categoryRecord: categories.find((entry) => entry.id === payload.categoryId) ?? null,
      subcategoryRecord: subcategories.find((entry) => entry.id === payload.subcategoryId) ?? null,
      city: payload.city || null,
      address: payload.address || null,
      phone: payload.phone || null,
      whatsapp: payload.whatsapp || null,
      email: payload.email || null,
      website: payload.website || null,
      instagram: payload.instagram || null,
      facebook: payload.facebook || null,
      notes: payload.notes || null,
      rating: payload.rating ?? current.rating,
      updatedAt: new Date().toISOString(),
    });
    return ok({ supplier: current });
  },
  deleteSupplier: (id: string) => {
    suppliers = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, isActive: false } : supplier));
    return ok(undefined);
  },
  restoreSupplier: (id: string) => {
    suppliers = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, isActive: true } : supplier));
    return ok(undefined);
  },
  listCatalogItems: (filters: CatalogFilters = {}) =>
    ok({ items: catalogItems.filter((item) => itemMatches(item, filters)) }),
  getCatalogItemDetail: (id: string) => ok(catalogDetail(id)),
  createCatalogItem: (payload: CatalogItemPayload) => {
    const item = makeItem(`item_${Date.now()}`, payload.name, payload.type, payload.unit ?? null, payload.categoryId ?? null, payload.brandId ?? null, 0);
    item.description = payload.description || null;
    item.subcategoryId = payload.subcategoryId ?? null;
    item.subcategory = subcategories.find((entry) => entry.id === payload.subcategoryId) ?? null;
    catalogItems = [item, ...catalogItems];
    return ok({ item });
  },
  updateCatalogItem: (id: string, payload: CatalogItemPayload) => {
    const item = catalogItems.find((entry) => entry.id === id) ?? catalogItems[0];
    Object.assign(item, {
      name: payload.name,
      type: payload.type,
      unit: payload.unit || null,
      categoryId: payload.categoryId || null,
      subcategoryId: payload.subcategoryId || null,
      brandId: payload.brandId || null,
      category: categories.find((category) => category.id === payload.categoryId) ?? null,
      subcategory: subcategories.find((subcategory) => subcategory.id === payload.subcategoryId) ?? null,
      brand: brands.find((brand) => brand.id === payload.brandId) ?? null,
      description: payload.description || null,
    });
    return ok({ item });
  },
  deleteCatalogItem: (id: string) => {
    catalogItems = catalogItems.filter((item) => item.id !== id);
    return ok(undefined);
  },
  restoreCatalogItem: (_id: string) => ok(undefined),
  listCategories: () => ok({ categories }),
  createCategory: (name: string) => {
    const category = { id: `cat_${Date.now()}`, name };
    categories.push(category);
    return ok({ category });
  },
  listSubcategories: (categoryId?: string) => ok({ subcategories: subcategories.filter((entry) => !categoryId || entry.categoryId === categoryId) }),
  createSubcategory: (payload: { categoryId: string; name: string }) => {
    const subcategory: CatalogSubcategory = {
      id: `sub_${Date.now()}`,
      categoryId: payload.categoryId,
      name: payload.name.toLocaleUpperCase("es"),
      category: categories.find((entry) => entry.id === payload.categoryId),
    };
    subcategories.push(subcategory);
    return ok({ subcategory });
  },
  listBrands: () => ok({ brands }),
  createBrand: (name: string) => {
    const brand = { id: `brand_${Date.now()}`, name };
    brands.push(brand);
    return ok({ brand });
  },
  listUnits: () => ok({ units }),
  createUnit: (payload: { name: string; abbreviation?: string }) => {
    const existing = units.find((unit) => unit.name.toLowerCase() === payload.name.trim().toLowerCase());
    if (existing) {
      return ok({ unit: existing });
    }

    const unit = makeUnit(payload.name.trim(), payload.abbreviation);
    units = [...units, unit].sort((left, right) => left.name.localeCompare(right.name, "es"));
    return ok({ unit });
  },
  listSupportTickets: (group: "ALL" | "OPEN" | "CLOSED" | "STANDBY" = "ALL") => ok({
    tickets: supportTickets.filter((ticket) =>
      group === "ALL"
        ? true
        : group === "OPEN"
          ? ["ABIERTO", "EN_REVISION"].includes(ticket.status)
          : group === "CLOSED"
            ? ["RESUELTO", "CERRADO"].includes(ticket.status)
            : ticket.status === "EN_ESPERA",
    ),
  }),
  updateSupportTicketStatus: (id: string, status: SupportTicket["status"]) => {
    const ticket = supportTickets.find((entry) => entry.id === id) ?? supportTickets[0];
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    return ok({ ticket });
  },
  createSupportTicket: (payload: { subject: string; category: string; priority: string; message: string }) => {
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      subject: payload.subject,
      category: payload.category as SupportTicket["category"],
      priority: payload.priority as SupportTicket["priority"],
      status: "ABIERTO",
      createdAt: now,
      updatedAt: now,
      organization: { id: organization.id, name: organization.name, slug: organization.slug },
      requester: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
      messages: [{ id: `msg_${Date.now()}`, authorType: "CLIENTE", body: payload.message, createdAt: now }],
    };
    supportTickets = [ticket, ...supportTickets];
    return ok({ ticket });
  },
  smartSearch: (query: string) => ok(makeSearch(query)),
  listPurchaseOrders: (filters: PurchaseOrderFilters = {}) =>
    ok({ orders: purchaseOrders.filter((order) => orderMatches(order, filters)) }),
  createPurchaseOrder: (payload: PurchaseOrderPayload) => {
    const order = makeOrder(`po_${Date.now()}`, `OC-2026-${String(purchaseOrders.length + 1).padStart(3, "0")}`, payload.supplierId, "BORRADOR", payload.lines);
    const center = costCenters.find((entry) => entry.id === payload.costCenterId) ?? null;
    order.costCenterId = center?.id ?? null;
    order.costCenter = center ? `${center.code} - ${center.name}` : payload.costCenter ?? null;
    order.costCenterRecord = center;
    purchaseOrders = [order, ...purchaseOrders];
    return ok({ order });
  },
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder["status"], warehouseId?: string) => {
    const order = purchaseOrders.find((entry) => entry.id === id) ?? purchaseOrders[0];
    order.status = status;
    if (status === "RECIBIDA" && warehouseId) {
      const warehouse = warehouses.find((entry) => entry.id === warehouseId) ?? warehouses[0];
      order.warehouseId = warehouse.id;
      order.warehouse = warehouse;
      order.receivedAt = new Date().toISOString();
      order.receivedBy = { id: demoUser.id, name: demoUser.name };
    }
    return ok({ order });
  },
  listQuoteRequests: (filters: QuoteRequestFilters = {}) =>
    ok({ requests: quoteRequests.filter((request) => quoteRequestMatches(request, filters)) }),
  createQuoteRequest: (payload: QuoteRequestPayload, attachments: File[] = []) => {
    const request = makeQuoteRequest(
      `qr_${Date.now()}`,
      `SC-2026-${String(quoteRequests.length + 1).padStart(5, "0")}`,
      payload.project,
      payload.costCenter || null,
      payload.items,
      attachments,
      payload.requesterName,
      payload.deadline,
      payload.observations,
      payload.supplierIds ?? [],
      payload.costCenterId,
    );
    quoteRequests = [request, ...quoteRequests];
    quoteRequestDraft = null;
    return ok({ request });
  },
  getQuoteRequestDraft: () => ok({ draft: quoteRequestDraft }),
  saveQuoteRequestDraft: (payload: any) => {
    quoteRequestDraft = {
      id: quoteRequestDraft?.id ?? "qr_draft_demo",
      payload,
      createdAt: quoteRequestDraft?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return ok({ draft: quoteRequestDraft });
  },
  deleteQuoteRequestDraft: () => {
    quoteRequestDraft = null;
    return ok(undefined);
  },
  getQuoteRequest: (id: string) => ok({ request: quoteRequests.find((request) => request.id === id) ?? quoteRequests[0] }),
  generateQuoteRequestEmail: (requestId: string, supplierId: string) => {
    const request = quoteRequests.find((entry) => entry.id === requestId) ?? quoteRequests[0];
    const selectedSupplier = request.suppliers.find((entry) => entry.supplierId === supplierId) ?? request.suppliers[0];
    const recipientEmail = selectedSupplier?.contactEmail ?? selectedSupplier?.supplier.email ?? "suplidor@demo.local";
    const recipientName = selectedSupplier?.contactName ?? selectedSupplier?.supplier.name ?? "Suplidor";
    const subject = `${request.number} - Solicitud de cotización`;
    const body = buildQuoteEmailBody(request, recipientName);
    const emailLog: QuoteRequestEmailLog = {
      id: `qr_email_${Date.now()}`,
      supplierId,
      recipientName,
      recipientEmail,
      subject,
      body,
      status: "GENERADO",
      createdAt: new Date().toISOString(),
    };

    request.emailLogs = [emailLog, ...request.emailLogs];
    request.status = request.status === "BORRADOR" ? "LISTA_PARA_ENVIAR" : request.status;
    refreshQuoteRequest(request);

    return ok({
      emailLog,
      mailtoUrl: `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    });
  },
  registerSupplierQuote: (
    requestId: string,
    payload: { supplierId: string; receivedAt?: string; observations?: string },
    file: File,
  ) => {
    const request = quoteRequests.find((entry) => entry.id === requestId) ?? quoteRequests[0];
    const supplier = findSupplier(payload.supplierId);
    const receivedAt = payload.receivedAt ? `${payload.receivedAt}T12:00:00.000Z` : new Date().toISOString();
    const quote: SupplierQuote = {
      id: `sq_${Date.now()}`,
      quoteRequestId: request.id,
      supplierId: supplier.id,
      supplier: pickComparisonSupplier(supplier),
      receivedAt,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      observations: payload.observations || null,
      reviewStatus: "ANALIZADA",
      analysis: { mode: "static-demo", message: "Datos simulados para vista previa estática." },
      createdAt: receivedAt,
      updatedAt: receivedAt,
      lines: request.items.map((item, index) => makeDemoQuoteLine(request.id, supplier, item, index)),
    };

    request.quotes = [quote, ...request.quotes.filter((entry) => entry.supplierId !== supplier.id)];
    request.status = "RECIBIENDO_COTIZACIONES";
    refreshQuoteRequest(request);

    return ok({ quote });
  },
  getPriceHistory: (filters: { itemId?: string; supplierId?: string } = {}) => ok(makePriceHistory(filters)),
  getReportsSummary: () => ok(makeReportsSummary()),
  listAiDocuments: () => ok({ documents: aiDocuments.map(toAiSummary) }),
  listAiChats: () => ok({ chats: aiChats.map(toAiChatSummary) }),
  createAiChat: (title: string) => {
    const chat: AiChatSummary = {
      id: `chat_${Date.now()}`,
      title: title.trim() || "Chat de documentos",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: 0,
      questionCount: 0,
      recentFiles: [],
    };
    aiChats = [chat, ...aiChats];
    aiChatQuestions[chat.id] = [];
    return ok({ chat });
  },
  getAiChat: (id: string) => ok({ chat: toAiChatDetail(aiChats.find((chat) => chat.id === id) ?? aiChats[0]) }),
  deleteAiChat: (id: string) => {
    aiChats = aiChats.filter((chat) => chat.id !== id);
    aiDocuments = aiDocuments.filter((document) => document.chatId !== id);
    delete aiChatQuestions[id];
    return ok({ chat: { id } });
  },
  uploadAiDocument: async (file: File) => {
    const text = await file.text().catch(() => "");
    const rowCount = Math.max(0, text.split(/\r?\n/).filter(Boolean).length - 1);
    const document: AiDocumentDetail = {
      id: `ai_${Date.now()}`,
      fileName: file.name,
      mimeType: file.type || null,
      extension: file.name.split(".").pop()?.toLowerCase() || null,
      sizeBytes: file.size,
      summary: `Documento demo importado. Se detectaron ${rowCount} filas o líneas útiles para vista previa.`,
      createdAt: new Date().toISOString(),
      sheetCount: rowCount ? 1 : 0,
      rowCount,
      questionCount: 0,
      extractedTextPreview: text.slice(0, 1800) || "Vista previa estática: el archivo quedó cargado para demostración.",
      questions: [],
    };
    aiDocuments = [document, ...aiDocuments];
    return clone({ document: toAiSummary(document) });
  },
  uploadAiChatDocument: async (chatId: string, file: File) => {
    const text = await file.text().catch(() => "");
    const rowCount = Math.max(0, text.split(/\r?\n/).filter(Boolean).length - 1);
    const document: AiDocumentDetail = {
      id: `ai_${Date.now()}`,
      chatId,
      fileName: file.name,
      mimeType: file.type || null,
      extension: file.name.split(".").pop()?.toLowerCase() || null,
      sizeBytes: file.size,
      summary: `Documento demo importado. Se detectaron ${rowCount} filas o lineas utiles para vista previa.`,
      createdAt: new Date().toISOString(),
      sheetCount: rowCount ? 1 : 0,
      rowCount,
      questionCount: 0,
      extractedTextPreview: text.slice(0, 1800) || "Vista previa estatica: el archivo quedo cargado para demostracion.",
      questions: [],
    };
    aiDocuments = [document, ...aiDocuments];
    touchAiChat(chatId);
    return clone({ document: toAiSummary(document) });
  },
  deleteAiDocument: (id: string) => {
    const document = aiDocuments.find((entry) => entry.id === id);
    aiDocuments = aiDocuments.filter((entry) => entry.id !== id);

    if (document?.chatId) {
      aiChatQuestions[document.chatId] = (aiChatQuestions[document.chatId] ?? []).filter(
        (question) => question.id !== id,
      );
      touchAiChat(document.chatId);
    }

    return ok({ document: { id, chatId: document?.chatId ?? null } });
  },
  getAiDocument: (id: string) => ok({ document: aiDocuments.find((document) => document.id === id) ?? aiDocuments[0] }),
  askAiDocument: (id: string, question: string) => {
    const document = id === "all" ? aiDocuments[0] : aiDocuments.find((entry) => entry.id === id) ?? aiDocuments[0];
    const answer: AiQuestionAnswer = {
      id: `ai_q_${Date.now()}`,
      question,
      answer: id === "all" ? answerWorkspaceQuestion(question) : answerDocumentQuestion(document, question),
      createdAt: new Date().toISOString(),
    };
    document.questions = [answer, ...document.questions];
    document.questionCount = document.questions.length;
    return ok({ answer });
  },
  askAiChat: (chatId: string, question: string) => {
    const answer: AiQuestionAnswer = {
      id: `ai_q_${Date.now()}`,
      question,
      answer: answerWorkspaceQuestion(question),
      createdAt: new Date().toISOString(),
    };
    aiChatQuestions[chatId] = [...(aiChatQuestions[chatId] ?? []), answer];
    touchAiChat(chatId);
    return ok({ answer });
  },
  getOrganizationWorkspace: () =>
    ok<OrganizationWorkspaceResponse>({
      organization: {
        ...organization,
        counts: {
          users: 1,
          suppliers: suppliers.filter((supplier) => supplier.isActive).length,
          items: catalogItems.length,
          supportTickets: supportTickets.length,
          orders: purchaseOrders.length,
          openTickets: supportTickets.filter((ticket) => ticket.status === "ABIERTO").length,
          warehouses: warehouses.length,
        },
      },
      users: [{ id: demoUser.id, name: demoUser.name, email: demoUser.email, role: demoUser.role, isActive: true, lastLoginAt: now, createdAt: now }],
    }),
  listAuditLogs: (limit: number) => ok({ logs: auditLogs.slice(0, limit) }),
  updateOrganizationUser: (_userId: string, payload: { role: string; isActive?: boolean }) => {
    demoUser.role = payload.role;
    return ok({ user: { id: demoUser.id, name: demoUser.name, email: demoUser.email, role: demoUser.role, isActive: payload.isActive ?? true, lastLoginAt: now, createdAt: now } });
  },
  listWarehouses: () => ok({ warehouses }),
  createWarehouse: (payload: { name: string; code: string; type: "GENERAL" | "PROJECT"; location?: string }) => {
    const warehouse: Warehouse = {
      id: `warehouse_${Date.now()}`,
      name: payload.name.toLocaleUpperCase("es"),
      code: payload.code.toLocaleUpperCase("es"),
      type: payload.type,
      location: payload.location?.toLocaleUpperCase("es") ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      balances: [],
      movements: [],
      _count: { balances: 0, movements: 0, purchaseOrders: 0 },
    };
    warehouses = [...warehouses, warehouse];
    return ok({ warehouse });
  },
  createInventoryMovement: (warehouseId: string, payload: { itemId: string; type: "SALIDA" | "AJUSTE"; quantity: number; unit?: string; reference?: string; notes?: string }) => {
    const warehouse = warehouses.find((entry) => entry.id === warehouseId) ?? warehouses[0];
    const item = catalogItems.find((entry) => entry.id === payload.itemId) ?? catalogItems[0];
    let balance = warehouse.balances.find((entry) => entry.itemId === item.id);
    if (!balance) {
      balance = { id: `balance_${Date.now()}`, itemId: item.id, quantity: "0.00", item };
      warehouse.balances.push(balance);
    }
    const delta = payload.type === "SALIDA" ? -Math.abs(payload.quantity) : payload.quantity;
    balance.quantity = Math.max(0, Number(balance.quantity) + delta).toFixed(2);
    const movement = {
      id: `movement_${Date.now()}`,
      warehouseId: warehouse.id,
      itemId: item.id,
      orderId: null,
      transferId: null,
      type: payload.type,
      quantity: Math.abs(payload.quantity).toFixed(2),
      unit: payload.unit ?? item.unit,
      reference: payload.reference ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
      item: { id: item.id, name: item.name, unit: item.unit },
      createdBy: { id: demoUser.id, name: demoUser.name },
      order: null,
    };
    warehouse.movements = [movement, ...warehouse.movements];
    return ok({ balance, movement });
  },
  listCostCenters: () => ok({ costCenters }),
  createCostCenter: (payload: { code: string; name: string; description?: string }) => {
    const costCenter: CostCenter = { id: `cc_${Date.now()}`, code: payload.code.toLocaleUpperCase("es"), name: payload.name.toLocaleUpperCase("es"), description: payload.description?.toLocaleUpperCase("es") ?? null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { quoteRequests: 0, purchaseOrders: 0 } };
    costCenters = [...costCenters, costCenter];
    return ok({ costCenter });
  },
  updateCostCenter: (id: string, payload: Partial<{ code: string; name: string; description: string; isActive: boolean }>) => {
    const costCenter = costCenters.find((entry) => entry.id === id) ?? costCenters[0];
    Object.assign(costCenter, { code: payload.code?.toLocaleUpperCase("es") ?? costCenter.code, name: payload.name?.toLocaleUpperCase("es") ?? costCenter.name, description: payload.description === undefined ? costCenter.description : payload.description.toLocaleUpperCase("es"), isActive: payload.isActive ?? costCenter.isActive, updatedAt: new Date().toISOString() });
    return ok({ costCenter });
  },
  listInventoryTransfers: () => ok({ transfers: inventoryTransfers }),
  createInventoryTransfer: (payload: { originWarehouseId: string; destinationWarehouseId: string; itemId: string; quantity: number; notes?: string }) => {
    const origin = warehouses.find((entry) => entry.id === payload.originWarehouseId) ?? warehouses[0];
    const destination = warehouses.find((entry) => entry.id === payload.destinationWarehouseId) ?? warehouses[1];
    const originBalance = origin.balances.find((entry) => entry.itemId === payload.itemId) ?? origin.balances[0];
    const item = originBalance.item;
    originBalance.quantity = (Number(originBalance.quantity) - payload.quantity).toFixed(2);
    let destinationBalance = destination.balances.find((entry) => entry.itemId === item.id);
    if (!destinationBalance) { destinationBalance = { id: `balance_${Date.now()}`, itemId: item.id, quantity: "0.00", item }; destination.balances.push(destinationBalance); }
    destinationBalance.quantity = (Number(destinationBalance.quantity) + payload.quantity).toFixed(2);
    const transfer: InventoryTransfer = { id: `transfer_${Date.now()}`, originWarehouseId: origin.id, destinationWarehouseId: destination.id, itemId: item.id, quantity: payload.quantity.toFixed(2), unit: item.unit, notes: payload.notes ?? null, createdAt: new Date().toISOString(), originWarehouse: { id: origin.id, name: origin.name, code: origin.code }, destinationWarehouse: { id: destination.id, name: destination.name, code: destination.code }, item: { id: item.id, name: item.name, unit: item.unit }, createdBy: { id: demoUser.id, name: demoUser.name } };
    inventoryTransfers = [transfer, ...inventoryTransfers];
    return ok({ transfer });
  },
  getAdminOverview: () =>
    ok<{ overview: AdminOverview }>({
      overview: { organizations: 2, users: 3, suppliers: suppliers.length, openTickets: supportTickets.length },
    }),
  listAdminOrganizations: () =>
    ok({
      organizations: [
        {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          accountType: organization.accountType,
          _count: { users: 1, suppliers: suppliers.length, supportTickets: supportTickets.length },
        },
      ],
    }),
  listAdminSupportTickets: () => ok({ tickets: supportTickets }),
};

function makeUnit(name: string, abbreviation?: string): UnitOfMeasure {
  const normalized = name.trim().toLowerCase();

  return {
    id: `unit_${normalized.replace(/[^a-z0-9]+/g, "_")}`,
    name: normalized,
    abbreviation: abbreviation || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function makeItem(
  id: string,
  name: string,
  type: CatalogItem["type"],
  unit: string | null,
  categoryId: string | null,
  brandId: string | null,
  supplierCount: number,
): CatalogItem {
  return {
    id,
    name,
    type,
    unit,
    description: null,
    categoryId,
    subcategoryId: null,
    brandId,
    category: categories.find((category) => category.id === categoryId) ?? null,
    subcategory: null,
    brand: brands.find((brand) => brand.id === brandId) ?? null,
    supplierCount,
  };
}

function makeOrder(
  id: string,
  number: string,
  supplierId: string,
  status: PurchaseOrder["status"],
  lines: Array<{ itemId: string; quantity: number; unitPrice: number }>,
): PurchaseOrder {
  const supplier = findSupplier(supplierId);
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = subtotal * 0.18;
  return {
    id,
    number,
    supplierId,
    organizationId: organization.id,
    quoteRequestId: null,
    warehouseId: null,
    receivedAt: null,
    costCenterId: null,
    costCenter: null,
    costCenterRecord: null,
    status,
    issueDate: now,
    currency: "DOP",
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: (subtotal + tax).toFixed(2),
    notes: null,
    supplier: pickSupplier(supplier),
    warehouse: null,
    quoteRequest: null,
    receivedBy: null,
    lines: lines.map((line, index) => {
      const item = catalogItems.find((entry) => entry.id === line.itemId) ?? catalogItems[0];
      return {
        id: `${id}_line_${index}`,
        itemId: line.itemId,
        quantity: line.quantity.toFixed(2),
        unitPrice: line.unitPrice.toFixed(2),
        lineTotal: (line.quantity * line.unitPrice).toFixed(2),
        item,
      };
    }),
  };
}

function makeQuoteRequest(
  id: string,
  number: string,
  project: string,
  costCenter: string | null,
  lines: QuoteRequestPayload["items"],
  files: File[] = [],
  requesterName = demoUser.name,
  deadline?: string,
  observations?: string,
  supplierIds: string[] = [],
  costCenterId?: string,
): QuoteRequest {
  const center = costCenters.find((entry) => entry.id === costCenterId) ?? null;
  const request: QuoteRequest = {
    id,
    number,
    status: "BORRADOR",
    project,
    costCenterId: center?.id ?? null,
    costCenter: center ? `${center.code} - ${center.name}` : costCenter,
    costCenterRecord: center,
    requesterName: requesterName || demoUser.name,
    deadline: deadline ? `${deadline}T23:59:59.999Z` : null,
    observations: observations || null,
    createdAt: now,
    updatedAt: now,
    requester: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
    items: lines.map((line, index) => ({
      id: `${id}_item_${index}`,
      lineNumber: index + 1,
      description: line.description,
      quantity: Number(line.quantity).toFixed(2),
      unit: line.unit,
      technicalSpecs: line.technicalSpecs || null,
    })),
    attachments: files.map((file, index) => ({
      id: `${id}_file_${index}`,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      createdAt: now,
    })),
    suppliers: supplierIds.map((supplierId, index) => makeQuoteRequestSupplier(id, supplierId, index)),
    emailLogs: [],
    quotes: [],
    comparison: { suppliers: [], rows: [] },
    itemCount: lines.length,
    attachmentCount: files.length,
    supplierCount: supplierIds.length,
    quoteCount: 0,
  };

  return refreshQuoteRequest(request);
}

function makeQuoteRequestSupplier(requestId: string, supplierId: string, index: number): QuoteRequestSupplier {
  const supplier = findSupplier(supplierId);
  const primary = supplier.contacts.find((contact) => contact.isPrimary) ?? supplier.contacts[0];

  return {
    id: `${requestId}_supplier_${index}`,
    supplierId: supplier.id,
    contactName: primary?.name ?? null,
    contactEmail: primary?.email ?? supplier.email,
    contactPhone: primary?.phone ?? supplier.phone,
    createdAt: now,
    supplier: {
      ...pickComparisonSupplier(supplier),
      contacts: supplier.contacts,
    },
  };
}

function makeDemoQuoteLine(
  requestId: string,
  supplier: Supplier,
  item: QuoteRequest["items"][number],
  index: number,
): SupplierQuoteLine {
  const itemQuantity = numberOrNull(item.quantity) ?? 1;
  const catalogPrice = supplier.catalogItems.find((catalogItem) => namesLookRelated(catalogItem.name, item.description));
  const fallbackBase = supplier.rating ? 320 + index * 160 + (6 - supplier.rating) * 55 : 520 + index * 160;
  const unitPrice = numberOrNull(catalogPrice?.lastPrice) ?? fallbackBase;
  const leadDays = catalogPrice?.leadTimeDays ?? Math.max(1, 2 + index + (5 - (supplier.rating ?? 3)));

  return {
    id: `${requestId}_${supplier.id}_line_${index}`,
    quoteRequestItemId: item.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    brand: supplier.catalogItems[index]?.name ? "Referencial" : null,
    model: null,
    unitPrice: unitPrice.toFixed(2),
    totalPrice: (unitPrice * itemQuantity).toFixed(2),
    tax: (unitPrice * itemQuantity * 0.18).toFixed(2),
    leadTime: `${leadDays} días`,
    warranty: "30 días",
    availability: "Disponible",
    observations: "Línea detectada desde la cotización demo.",
    matchScore: catalogPrice ? 94 : 78,
    differences: catalogPrice ? null : "Revisar descripción ofrecida contra la especificación solicitada.",
    rawText: item.description,
  };
}

function refreshQuoteRequest(request: QuoteRequest) {
  request.itemCount = request.items.length;
  request.attachmentCount = request.attachments.length;
  request.supplierCount = request.suppliers.length;
  request.quoteCount = request.quotes.length;
  request.updatedAt = new Date().toISOString();
  request.comparison = buildQuoteComparison(request);
  return request;
}

function buildQuoteComparison(request: QuoteRequest): QuoteComparison {
  const suppliersForComparison = request.suppliers.map((entry) => {
    const latestQuote = request.quotes.find((quote) => quote.supplierId === entry.supplierId) ?? null;

    return {
      supplierId: entry.supplierId,
      supplierName: entry.supplier.name,
      rating: entry.supplier.rating ?? 0,
      quoteId: latestQuote?.id ?? null,
      quoteStatus: latestQuote?.reviewStatus ?? null,
    };
  });

  const rows = request.items.map((item) => {
    const offers = suppliersForComparison.map((supplierEntry) => {
      const quote = request.quotes.find((entry) => entry.supplierId === supplierEntry.supplierId) ?? null;
      const line = quote?.lines.find((entry) => entry.quoteRequestItemId === item.id) ?? null;

      return {
        supplierId: supplierEntry.supplierId,
        supplierName: supplierEntry.supplierName,
        quoteId: quote?.id ?? null,
        lineId: line?.id ?? null,
        unitPrice: numberOrNull(line?.unitPrice),
        totalPrice: numberOrNull(line?.totalPrice),
        brand: line?.brand ?? null,
        model: line?.model ?? null,
        leadTime: line?.leadTime ?? null,
        leadDays: parseLeadDays(line?.leadTime),
        warranty: line?.warranty ?? null,
        availability: line?.availability ?? null,
        observations: line?.observations ?? null,
        differences: line?.differences ?? null,
        matchScore: line?.matchScore ?? null,
        isBestPrice: false,
        isBestDelivery: false,
      };
    });

    const validPrices = offers.map((offer) => offer.totalPrice).filter((value): value is number => typeof value === "number");
    const validLeads = offers.map((offer) => offer.leadDays).filter((value): value is number => typeof value === "number");
    const bestPrice = validPrices.length ? Math.min(...validPrices) : null;
    const bestDelivery = validLeads.length ? Math.min(...validLeads) : null;

    return {
      item,
      offers: offers.map((offer) => ({
        ...offer,
        isBestPrice: bestPrice !== null && offer.totalPrice === bestPrice,
        isBestDelivery: bestDelivery !== null && offer.leadDays === bestDelivery,
      })),
    };
  });

  return { suppliers: suppliersForComparison, rows };
}

function buildQuoteEmailBody(request: QuoteRequest, recipientName: string) {
  const itemLines = request.items
    .map(
      (item) =>
        `${item.lineNumber}. ${item.description} - ${Number(item.quantity).toLocaleString("es-DO")} ${item.unit}${
          item.technicalSpecs ? ` (${item.technicalSpecs})` : ""
        }`,
    )
    .join("\n");

  return [
    `Hola ${recipientName},`,
    "",
    `Por este medio solicitamos cotización para la solicitud ${request.number}.`,
    `Proyecto/Centro: ${request.project}`,
    request.costCenter ? `Centro de costo: ${request.costCenter}` : "",
    request.deadline ? `Fecha límite de respuesta: ${new Date(request.deadline).toLocaleDateString("es-DO")}` : "",
    "",
    "Detalle requerido:",
    itemLines,
    "",
    request.observations ? `Observaciones: ${request.observations}` : "",
    "",
    "Favor incluir precio unitario, precio total, impuestos, marca, modelo, disponibilidad, garantía y tiempo de entrega.",
    "",
    "Saludos,",
    "Smart Source",
  ]
    .filter(Boolean)
    .join("\n");
}

function pickComparisonSupplier(supplier: Supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    rnc: supplier.rnc,
    category: supplier.category,
    city: supplier.city,
    phone: supplier.phone,
    email: supplier.email,
    rating: supplier.rating,
  };
}

function namesLookRelated(left: string, right: string) {
  const leftTokens = tokenizeText(left);
  const rightTokens = tokenizeText(right);

  if (!leftTokens.length || !rightTokens.length) {
    return false;
  }

  return leftTokens.some((token) => rightTokens.includes(token));
}

function tokenizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function numberOrNull(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLeadDays(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function point(id: string, itemId: string, itemName: string, supplierId: string, supplierName: string, price: number, source: string): PricePoint {
  return { id, itemId, itemName, supplierId, supplierName, price, currency: "DOP", recordedAt: now, source };
}

function supplierMatches(supplier: Supplier, filters: SupplierFilters) {
  const search = normalizeDemoSearch(filters.search);
  const searchableFields = [
    supplier.name,
    supplier.rnc,
    supplier.category,
    supplier.city,
    supplier.address,
    supplier.phone,
    supplier.whatsapp,
    supplier.email,
    supplier.website,
    supplier.notes,
    ...supplier.tags,
    ...supplier.contacts.flatMap((contact) => [contact.name, contact.role, contact.phone, contact.whatsapp, contact.email]),
    ...supplier.catalogItems.flatMap((item) => [item.name, item.type, item.unit, item.lastPrice, item.currency, item.leadTimeDays?.toString()]),
  ];
  const haystack = normalizeDemoSearch(searchableFields.filter(Boolean).join(" "));

  return (
    supplier.isActive &&
    (!search || haystack.includes(search)) &&
    (!filters.category || supplier.category === filters.category) &&
    (!filters.city || supplier.city === filters.city) &&
    (!filters.tag || supplier.tags.includes(filters.tag))
  );
}

function normalizeDemoSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function itemMatches(item: CatalogItem, filters: CatalogFilters) {
  const search = filters.search?.toLowerCase();
  return (
    (!search || item.name.toLowerCase().includes(search)) &&
    (!filters.type || item.type === filters.type) &&
    (!filters.categoryId || item.categoryId === filters.categoryId) &&
    (!filters.subcategoryId || item.subcategoryId === filters.subcategoryId) &&
    (!filters.brandId || item.brandId === filters.brandId)
  );
}

function orderMatches(order: PurchaseOrder, filters: PurchaseOrderFilters) {
  const search = filters.search?.toLowerCase();
  return (
    (!filters.status || order.status === filters.status) &&
    (!filters.supplierId || order.supplierId === filters.supplierId) &&
    (!search || order.number.toLowerCase().includes(search) || order.supplier.name.toLowerCase().includes(search))
  );
}

function quoteRequestMatches(request: QuoteRequest, filters: QuoteRequestFilters) {
  const search = filters.search?.toLowerCase();
  return (
    (!filters.status || request.status === filters.status) &&
    (!search ||
      request.number.toLowerCase().includes(search) ||
      request.project.toLowerCase().includes(search) ||
      request.costCenter?.toLowerCase().includes(search) ||
      request.suppliers.some((entry) => entry.supplier.name.toLowerCase().includes(search)) ||
      request.items.some((item) => item.description.toLowerCase().includes(search)))
  );
}

function findSupplier(id: string) {
  return suppliers.find((supplier) => supplier.id === id) ?? suppliers[0];
}

function pickSupplier(supplier: Supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    rnc: supplier.rnc,
    city: supplier.city,
    category: supplier.category,
    email: supplier.email,
    phone: supplier.phone,
  };
}

function catalogDetail(id: string): CatalogItemDetailResponse {
  const item = catalogItems.find((entry) => entry.id === id) ?? catalogItems[0];
  const matchingSuppliers = suppliers
    .filter((supplier) => supplier.catalogItems.some((catalogItem) => catalogItem.id === item.id))
    .map((supplier) => {
      const supplierItem = supplier.catalogItems.find((catalogItem) => catalogItem.id === item.id);
      return {
        supplierId: supplier.id,
        itemId: item.id,
        lastPrice: supplierItem?.lastPrice ?? null,
        currency: supplierItem?.currency ?? "DOP",
        leadTimeDays: supplierItem?.leadTimeDays ?? null,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          rnc: supplier.rnc,
          city: supplier.city,
          address: supplier.address,
          category: supplier.category,
          phone: supplier.phone,
          email: supplier.email,
        },
      };
    });
  const purchases = purchaseOrders.flatMap((order) =>
    order.lines
      .filter((line) => line.itemId === item.id)
      .map((line) => ({
        id: line.id,
        orderId: order.id,
        orderNumber: order.number,
        status: order.status,
        issueDate: order.issueDate,
        currency: order.currency,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        orderTotal: order.total,
        supplier: {
          id: order.supplier.id,
          name: order.supplier.name,
          rnc: order.supplier.rnc,
          city: order.supplier.city,
          address: findSupplier(order.supplier.id).address,
          category: order.supplier.category,
          phone: order.supplier.phone,
          email: order.supplier.email,
        },
      })),
  );
  const history = pricePoints.filter((point) => point.itemId === item.id);
  const totalSpend = purchases.reduce((sum, purchase) => sum + Number(purchase.lineTotal), 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + Number(purchase.quantity), 0);
  return {
    item,
    suppliers: matchingSuppliers,
    purchases,
    priceHistory: history.map((entry) => {
      const supplier = findSupplier(entry.supplierId);
      return {
        id: entry.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierCity: supplier.city,
        supplierAddress: supplier.address,
        supplierCategory: supplier.category,
        price: entry.price.toFixed(2),
        currency: entry.currency,
        recordedAt: entry.recordedAt,
        source: entry.source,
      };
    }),
    summary: {
      purchaseCount: purchases.length,
      supplierCount: matchingSuppliers.length,
      totalQuantity,
      totalSpend,
      averageUnitPrice: totalQuantity ? totalSpend / totalQuantity : 0,
      lastPurchaseAt: purchases[0]?.issueDate ?? null,
    },
  };
}

function makePriceHistory(filters: { itemId?: string; supplierId?: string }): PriceHistoryResponse {
  const selectedItemId = filters.itemId ?? catalogItems[0]?.id ?? null;
  const points = pricePoints.filter(
    (point) => (!filters.itemId || point.itemId === filters.itemId) && (!filters.supplierId || point.supplierId === filters.supplierId),
  );
  const values = points.map((point) => point.price);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    items: catalogItems,
    suppliers: suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name, category: supplier.category, city: supplier.city })),
    selectedItemId,
    selectedSupplierId: filters.supplierId ?? null,
    points,
    latestBySupplier: points,
    summary: { count: points.length, min, max, average, variationPercent: min ? ((max - min) / min) * 100 : 0 },
  };
}

function makeReportsSummary(): ReportsSummaryResponse {
  const totalSpend = purchaseOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const spendingBySupplier = suppliers.map((supplier) => {
    const orders = purchaseOrders.filter((order) => order.supplierId === supplier.id);
    return { key: supplier.id, supplierId: supplier.id, supplierName: supplier.name, amount: orders.reduce((sum, order) => sum + Number(order.total), 0), count: orders.length };
  }).filter((row) => row.count);
  const spendingByCategory = categories.map((category) => {
    const itemIds = catalogItems.filter((item) => item.categoryId === category.id).map((item) => item.id);
    const lines = purchaseOrders.flatMap((order) => order.lines.filter((line) => itemIds.includes(line.itemId)));
    return { key: category.id, category: category.name, amount: lines.reduce((sum, line) => sum + Number(line.lineTotal), 0), count: lines.length };
  }).filter((row) => row.count);
  const spendingByStatus = (["BORRADOR", "ENVIADA", "RECIBIDA", "CANCELADA"] as const).map((status) => {
    const orders = purchaseOrders.filter((order) => order.status === status);
    return { key: status, status, amount: orders.reduce((sum, order) => sum + Number(order.total), 0), count: orders.length };
  });

  return {
    overview: {
      suppliers: suppliers.length,
      items: catalogItems.length,
      orders: purchaseOrders.length,
      supportTickets: supportTickets.length,
      subtotal: purchaseOrders.reduce((sum, order) => sum + Number(order.subtotal), 0),
      tax: purchaseOrders.reduce((sum, order) => sum + Number(order.tax), 0),
      totalSpend,
      averageOrder: purchaseOrders.length ? totalSpend / purchaseOrders.length : 0,
      currency: "DOP",
    },
    spendingBySupplier,
    spendingByCategory,
    spendingByMonth: [{ key: "2026-07", month: "jul 2026", amount: totalSpend, count: purchaseOrders.length }],
    spendingByStatus,
    recentOrders: purchaseOrders.slice(0, 5).map((order) => ({
      id: order.id,
      number: order.number,
      supplierName: order.supplier.name,
      status: order.status,
      issueDate: order.issueDate,
      total: order.total,
      currency: order.currency,
    })),
  };
}

function makeSearch(query: string): SmartSearchResponse {
  const normalized = query.toLowerCase();
  const supplierResults = suppliers
    .filter((supplier) => supplier.name.toLowerCase().includes(normalized) || supplier.category?.toLowerCase().includes(normalized))
    .map((supplier) => ({
      id: supplier.id,
      type: "supplier" as const,
      title: supplier.name,
      subtitle: `${supplier.city ?? "Sin ciudad"} · ${supplier.category ?? "Sin categoría"}`,
      description: supplier.notes,
      path: `/suppliers/${supplier.id}`,
      meta: supplier.tags,
    }));
  const itemResults = catalogItems
    .filter((item) => item.name.toLowerCase().includes(normalized))
    .map((item) => ({
      id: item.id,
      type: "item" as const,
      title: item.name,
      subtitle: item.category?.name ?? "Catálogo",
      description: item.description,
      path: `/catalog/${item.id}`,
      meta: [item.type, item.unit ?? ""].filter(Boolean),
    }));
  return {
    query,
    total: supplierResults.length + itemResults.length,
    groups: [
      { key: "suppliers", label: "Suplidores", count: supplierResults.length, results: supplierResults },
      { key: "catalog", label: "Catálogo", count: itemResults.length, results: itemResults },
      { key: "contacts", label: "Contactos", count: 0, results: [] },
      { key: "categories", label: "Categorías", count: 0, results: [] },
      { key: "brands", label: "Marcas", count: 0, results: [] },
      { key: "tags", label: "Etiquetas", count: 0, results: [] },
    ],
  };
}

function toAiSummary(document: AiDocumentDetail): AiDocumentSummary {
  const { extractedTextPreview: _preview, questions: _questions, ...summary } = document;
  return summary;
}

function toAiChatSummary(chat: AiChatSummary): AiChatSummary {
  const documents = aiDocuments.filter((document) => document.chatId === chat.id);
  const questions = aiChatQuestions[chat.id] ?? [];

  return {
    ...chat,
    documentCount: documents.length,
    questionCount: questions.length,
    recentFiles: documents.slice(0, 3).map((document) => document.fileName),
  };
}

function toAiChatDetail(chat: AiChatSummary): AiChatDetail {
  return {
    ...toAiChatSummary(chat),
    documents: aiDocuments.filter((document) => document.chatId === chat.id).map(toAiSummary),
    questions: aiChatQuestions[chat.id] ?? [],
  };
}

function touchAiChat(chatId: string) {
  aiChats = aiChats.map((chat) => (chat.id === chatId ? { ...chat, updatedAt: new Date().toISOString() } : chat));
}

function answerDocumentQuestion(document: AiDocumentDetail, question: string) {
  const text = document.extractedTextPreview;
  const numbers = Array.from(text.matchAll(/(?:total|monto|importe)?[^\d]*(\d+(?:[.,]\d+)?)/gi)).map((match) => Number(match[1].replace(",", ".")));
  const total = numbers.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

  if (/trata|resumen|contenido|que dice|de que/i.test(question)) {
    return `Claro. El documento "${document.fileName}" trata principalmente de la información que cargaste para análisis. Puedo resumirlo, buscar datos específicos o ayudarte a comparar puntos importantes.\n\nLo primero que pude leer fue:\n${text.slice(0, 420)}`;
  }

  if (/total|monto|gasto|compr/i.test(question) && total) {
    return `En esta vista demo encontré un total aproximado de ${new Intl.NumberFormat("es-DO").format(total)} en el documento.`;
  }

  return `Encontré esta información relacionada en el documento:\n${text.slice(0, 500)}`;
}

function answerWorkspaceQuestion(question: string) {
  if (/barat|precio|cotiz|vende|vendiendo|manzana/i.test(question)) {
    return [
      'La opción más barata para "Manzana roja" es Mercado Norte: DOP 48.50.',
      "1. Mercado Norte - Manzana roja - DOP 48.50 - cotizacion-mercado-norte.pdf",
      "2. Agro Caribe - Manzana - DOP 51.00 - cotizacion-agro-caribe.pdf",
      "3. Frutas Premium - Manzana roja importada - DOP 57.25 - cotizacion-frutas-premium.pdf",
      'Guardé estas equivalencias para futuras consultas: "manzana roja" = "manzana", "manzana roja importada" = "manzana".',
    ].join("\n\n");
  }

  if (/trata|resumen|contenido|que dice|de que/i.test(question)) {
    return "Claro. Este chat reúne documentos cargados para análisis. Puedo explicarte de qué trata cada archivo, sacar puntos importantes, buscar datos concretos o comparar información entre documentos.";
  }

  return "Sí, ya tengo los documentos demo cargados en este chat. Puedes pedirme un resumen, buscar datos concretos, comparar archivos o extraer información importante.";
}

function ok<T>(value: T) {
  return Promise.resolve(clone(value));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

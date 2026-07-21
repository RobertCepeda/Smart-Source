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
  HealthResponse,
  OrganizationWorkspaceResponse,
  PriceHistoryResponse,
  PricePoint,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderPayload,
  ReportsSummaryResponse,
  SmartSearchResponse,
  Supplier,
  SupplierFilters,
  SupplierPayload,
  SupportTicket,
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

const brands: CatalogEntity[] = [
  { id: "brand_acme", name: "Acme" },
  { id: "brand_delta", name: "Delta" },
  { id: "brand_nexans", name: "Nexans" },
  { id: "brand_truper", name: "Truper" },
];

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
      category: payload.category || null,
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
      category: payload.category || null,
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
  listCatalogItems: (filters: CatalogFilters = {}) =>
    ok({ items: catalogItems.filter((item) => itemMatches(item, filters)) }),
  getCatalogItemDetail: (id: string) => ok(catalogDetail(id)),
  createCatalogItem: (payload: CatalogItemPayload) => {
    const item = makeItem(`item_${Date.now()}`, payload.name, payload.type, payload.unit ?? null, payload.categoryId ?? null, payload.brandId ?? null, 0);
    item.description = payload.description || null;
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
      brandId: payload.brandId || null,
      category: categories.find((category) => category.id === payload.categoryId) ?? null,
      brand: brands.find((brand) => brand.id === payload.brandId) ?? null,
      description: payload.description || null,
    });
    return ok({ item });
  },
  deleteCatalogItem: (id: string) => {
    catalogItems = catalogItems.filter((item) => item.id !== id);
    return ok(undefined);
  },
  listCategories: () => ok({ categories }),
  createCategory: (name: string) => {
    const category = { id: `cat_${Date.now()}`, name };
    categories.push(category);
    return ok({ category });
  },
  listBrands: () => ok({ brands }),
  createBrand: (name: string) => {
    const brand = { id: `brand_${Date.now()}`, name };
    brands.push(brand);
    return ok({ brand });
  },
  listSupportTickets: () => ok({ tickets: supportTickets }),
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
    purchaseOrders = [order, ...purchaseOrders];
    return ok({ order });
  },
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder["status"]) => {
    const order = purchaseOrders.find((entry) => entry.id === id) ?? purchaseOrders[0];
    order.status = status;
    return ok({ order });
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
        },
      },
      users: [{ id: demoUser.id, name: demoUser.name, email: demoUser.email, role: demoUser.role, isActive: true, lastLoginAt: now, createdAt: now }],
    }),
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
    brandId,
    category: categories.find((category) => category.id === categoryId) ?? null,
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
    status,
    issueDate: now,
    currency: "DOP",
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: (subtotal + tax).toFixed(2),
    notes: null,
    supplier: pickSupplier(supplier),
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

function point(id: string, itemId: string, itemName: string, supplierId: string, supplierName: string, price: number, source: string): PricePoint {
  return { id, itemId, itemName, supplierId, supplierName, price, currency: "DOP", recordedAt: now, source };
}

function supplierMatches(supplier: Supplier, filters: SupplierFilters) {
  const search = filters.search?.toLowerCase();
  return (
    supplier.isActive &&
    (!search || [supplier.name, supplier.category, supplier.city, supplier.email].some((value) => value?.toLowerCase().includes(search))) &&
    (!filters.category || supplier.category === filters.category) &&
    (!filters.city || supplier.city === filters.city) &&
    (!filters.tag || supplier.tags.includes(filters.tag))
  );
}

function itemMatches(item: CatalogItem, filters: CatalogFilters) {
  const search = filters.search?.toLowerCase();
  return (
    (!search || item.name.toLowerCase().includes(search)) &&
    (!filters.type || item.type === filters.type) &&
    (!filters.categoryId || item.categoryId === filters.categoryId) &&
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

import { demoApi, demoToken, demoUser } from "./demoApi";

export const isDemoMode = import.meta.env.MODE === "github" || import.meta.env.VITE_DEMO_MODE === "true";
export const DEMO_TOKEN = demoToken;
export const DEMO_USER = demoUser;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type HealthResponse = {
  app: string;
  status: string;
  module: string;
};

export type AuthUser = {
  id: string;
  organizationId: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    accountType: "PERSONAL" | "BUSINESS";
    plan: string;
  } | null;
  name: string;
  email: string;
  company: string | null;
  avatarUrl: string | null;
  authProvider: "EMAIL" | "GOOGLE";
  role: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
  company?: string;
  accountType: "PERSONAL" | "BUSINESS";
};

export type SupplierContact = {
  id: string;
  supplierId: string;
  name: string;
  role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  isPrimary: boolean;
};

export type SupplierCatalogItem = {
  id: string;
  name: string;
  type: "MATERIAL" | "SERVICIO";
  unit: string | null;
  lastPrice: string | null;
  currency: string;
  leadTimeDays: number | null;
};

export type Supplier = {
  id: string;
  name: string;
  rnc: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  notes: string | null;
  rating: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contacts: SupplierContact[];
  tags: string[];
  catalogItems: SupplierCatalogItem[];
};

export type SupplierPayload = {
  name: string;
  rnc?: string;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  notes?: string;
  rating?: number;
  contacts?: Array<{
    name: string;
    role?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
  tags?: string[];
  catalogItems?: Array<{
    name: string;
    type: "MATERIAL" | "SERVICIO";
    unit?: string;
    lastPrice?: number | "";
  }>;
};

export type SupplierFilters = {
  search?: string;
  category?: string;
  city?: string;
  tag?: string;
};

export type CatalogEntity = {
  id: string;
  name: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  type: "MATERIAL" | "SERVICIO";
  unit: string | null;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  category: CatalogEntity | null;
  brand: CatalogEntity | null;
  supplierCount: number;
};

export type CatalogItemDetailSupplier = {
  supplierId: string;
  itemId: string;
  lastPrice: string | null;
  currency: string;
  leadTimeDays: number | null;
  supplier: Pick<Supplier, "id" | "name" | "rnc" | "city" | "address" | "category" | "phone" | "email">;
};

export type CatalogItemPurchase = {
  id: string;
  orderId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  issueDate: string;
  currency: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  orderTotal: string;
  supplier: Pick<Supplier, "id" | "name" | "rnc" | "city" | "address" | "category" | "phone" | "email">;
};

export type CatalogItemPriceRecord = {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCity: string | null;
  supplierAddress: string | null;
  supplierCategory: string | null;
  price: string;
  currency: string;
  recordedAt: string;
  source: string;
};

export type CatalogItemDetailResponse = {
  item: CatalogItem;
  suppliers: CatalogItemDetailSupplier[];
  purchases: CatalogItemPurchase[];
  priceHistory: CatalogItemPriceRecord[];
  summary: {
    purchaseCount: number;
    supplierCount: number;
    totalQuantity: number;
    totalSpend: number;
    averageUnitPrice: number;
    lastPurchaseAt: string | null;
  };
};

export type CatalogItemPayload = {
  name: string;
  type: "MATERIAL" | "SERVICIO";
  unit?: string;
  categoryId?: string;
  brandId?: string;
  description?: string;
};

export type CatalogFilters = {
  search?: string;
  type?: "MATERIAL" | "SERVICIO";
  categoryId?: string;
  brandId?: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  category: "SOPORTE" | "MANTENIMIENTO" | "FACTURACION" | "IDEA";
  priority: "BAJA" | "NORMAL" | "ALTA";
  status: "ABIERTO" | "EN_REVISION" | "RESUELTO" | "CERRADO";
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  messages: Array<{
    id: string;
    authorType: "CLIENTE" | "ADMIN" | "AUTOMATICO";
    body: string;
    createdAt: string;
  }>;
};

export type AdminOverview = {
  organizations: number;
  users: number;
  suppliers: number;
  openTickets: number;
};

export type SmartSearchResult = {
  id: string;
  type: "supplier" | "contact" | "item" | "category" | "brand" | "tag";
  title: string;
  subtitle: string;
  description: string | null;
  path: string;
  meta: string[];
};

export type SmartSearchGroup = {
  key: "suppliers" | "contacts" | "catalog" | "categories" | "brands" | "tags";
  label: string;
  count: number;
  results: SmartSearchResult[];
};

export type SmartSearchResponse = {
  query: string;
  total: number;
  groups: SmartSearchGroup[];
};

export type PurchaseOrderStatus = "BORRADOR" | "ENVIADA" | "RECIBIDA" | "CANCELADA";

export type PurchaseOrderLine = {
  id: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  item: CatalogItem & {
    category: CatalogEntity | null;
    brand: CatalogEntity | null;
  };
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  issueDate: string;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  supplier: Pick<Supplier, "id" | "name" | "rnc" | "city" | "category" | "email" | "phone">;
  lines: PurchaseOrderLine[];
};

export type PurchaseOrderPayload = {
  supplierId: string;
  issueDate?: string;
  currency: string;
  taxRate: number;
  notes?: string;
  lines: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type PurchaseOrderFilters = {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type QuoteRequestStatus =
  | "BORRADOR"
  | "LISTA_PARA_ENVIAR"
  | "ENVIADA"
  | "RECIBIENDO_COTIZACIONES"
  | "CERRADA"
  | "CANCELADA";

export type QuoteRequestItem = {
  id: string;
  lineNumber: number;
  description: string;
  quantity: string;
  unit: string;
  technicalSpecs: string | null;
};

export type QuoteRequestAttachment = {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
};

export type QuoteRequest = {
  id: string;
  number: string;
  status: QuoteRequestStatus;
  project: string;
  costCenter: string | null;
  requesterName: string;
  deadline: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Pick<AuthUser, "id" | "name" | "email"> | null;
  items: QuoteRequestItem[];
  attachments: QuoteRequestAttachment[];
  itemCount: number;
  attachmentCount: number;
};

export type QuoteRequestPayload = {
  project: string;
  costCenter?: string;
  requesterName?: string;
  deadline?: string;
  observations?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    technicalSpecs?: string;
  }>;
};

export type QuoteRequestFilters = {
  status?: QuoteRequestStatus;
  search?: string;
};

export type PricePoint = {
  id: string;
  itemId: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  price: number;
  currency: string;
  recordedAt: string;
  source: string;
};

export type PriceHistoryResponse = {
  items: Array<CatalogItem & { category: CatalogEntity | null; brand: CatalogEntity | null }>;
  suppliers: Array<Pick<Supplier, "id" | "name" | "category" | "city">>;
  selectedItemId: string | null;
  selectedSupplierId: string | null;
  points: PricePoint[];
  latestBySupplier: PricePoint[];
  summary: {
    count: number;
    min: number;
    max: number;
    average: number;
    variationPercent: number;
  };
};

export type ReportsSummaryResponse = {
  overview: {
    suppliers: number;
    items: number;
    orders: number;
    supportTickets: number;
    subtotal: number;
    tax: number;
    totalSpend: number;
    averageOrder: number;
    currency: string;
  };
  spendingBySupplier: Array<{ key: string; supplierId: string; supplierName: string; amount: number; count: number }>;
  spendingByCategory: Array<{ key: string; category: string; amount: number; count: number }>;
  spendingByMonth: Array<{ key: string; month: string; amount: number; count: number }>;
  spendingByStatus: Array<{ key: PurchaseOrderStatus; status: PurchaseOrderStatus; amount: number; count: number }>;
  recentOrders: Array<{
    id: string;
    number: string;
    supplierName: string;
    status: PurchaseOrderStatus;
    issueDate: string;
    total: string;
    currency: string;
  }>;
};

export type OrganizationWorkspaceResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
    billingEmail: string | null;
    status: "ACTIVE" | "PAUSED" | "CANCELLED";
    accountType: "PERSONAL" | "BUSINESS";
    plan: string;
    createdAt: string;
    updatedAt: string;
    counts: {
      users: number;
      suppliers: number;
      items: number;
      supportTickets: number;
      orders: number;
      openTickets: number;
    };
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
};

export type AiDocumentSummary = {
  id: string;
  chatId?: string | null;
  fileName: string;
  mimeType: string | null;
  extension: string | null;
  sizeBytes: number;
  summary: string;
  createdAt: string;
  sheetCount: number;
  rowCount: number;
  questionCount: number;
};

export type AiQuestionAnswer = {
  id: string;
  question: string;
  answer: string;
  context?: unknown;
  createdAt: string;
};

export type AiDocumentDetail = AiDocumentSummary & {
  extractedTextPreview: string;
  questions: AiQuestionAnswer[];
};

export type AiChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  questionCount: number;
  recentFiles: string[];
};

export type AiChatDetail = AiChatSummary & {
  documents: AiDocumentSummary[];
  questions: AiQuestionAnswer[];
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No pudimos completar la solicitud. Intenta de nuevo.");
  }

  return data as T;
}

export async function getHealth(): Promise<HealthResponse> {
  if (isDemoMode) {
    return demoApi.getHealth();
  }

  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("No se pudo conectar con la API");
  }

  return response.json() as Promise<HealthResponse>;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  if (isDemoMode) {
    return demoApi.login();
  }

  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  if (isDemoMode) {
    return demoApi.register();
  }

  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function meRequest(token: string): Promise<{ user: AuthUser }> {
  if (isDemoMode) {
    return demoApi.me();
  }

  return apiRequest<{ user: AuthUser }>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfileRequest(
  token: string,
  payload: { name?: string; company?: string; avatarUrl?: string },
) {
  if (isDemoMode) {
    return demoApi.updateProfile(payload);
  }

  return apiRequest<{ user: AuthUser }>("/auth/profile", {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function queryString(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listSuppliersRequest(token: string, filters: SupplierFilters = {}) {
  if (isDemoMode) {
    return demoApi.listSuppliers(filters);
  }

  return apiRequest<{ suppliers: Supplier[] }>(`/suppliers${queryString(filters)}`, {
    headers: authHeaders(token),
  });
}

export async function getSupplierRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.getSupplier(id);
  }

  return apiRequest<{ supplier: Supplier }>(`/suppliers/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createSupplierRequest(token: string, payload: SupplierPayload) {
  if (isDemoMode) {
    return demoApi.createSupplier(payload);
  }

  return apiRequest<{ supplier: Supplier }>("/suppliers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateSupplierRequest(token: string, id: string, payload: SupplierPayload) {
  if (isDemoMode) {
    return demoApi.updateSupplier(id, payload);
  }

  return apiRequest<{ supplier: Supplier }>(`/suppliers/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteSupplierRequest(token: string, id: string) {
  if (isDemoMode) {
    await demoApi.deleteSupplier(id);
    return;
  }

  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "No se pudo desactivar el suplidor");
  }
}

export async function listCatalogItemsRequest(token: string, filters: CatalogFilters = {}) {
  if (isDemoMode) {
    return demoApi.listCatalogItems(filters);
  }

  return apiRequest<{ items: CatalogItem[] }>(`/items${queryString(filters)}`, {
    headers: authHeaders(token),
  });
}

export async function getCatalogItemDetailRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.getCatalogItemDetail(id);
  }

  return apiRequest<CatalogItemDetailResponse>(`/items/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createCatalogItemRequest(token: string, payload: CatalogItemPayload) {
  if (isDemoMode) {
    return demoApi.createCatalogItem(payload);
  }

  return apiRequest<{ item: CatalogItem }>("/items", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateCatalogItemRequest(token: string, id: string, payload: CatalogItemPayload) {
  if (isDemoMode) {
    return demoApi.updateCatalogItem(id, payload);
  }

  return apiRequest<{ item: CatalogItem }>(`/items/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteCatalogItemRequest(token: string, id: string) {
  if (isDemoMode) {
    await demoApi.deleteCatalogItem(id);
    return;
  }

  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "No se pudo desactivar el item");
  }
}

export async function listCategoriesRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listCategories();
  }

  return apiRequest<{ categories: CatalogEntity[] }>("/categories", {
    headers: authHeaders(token),
  });
}

export async function createCategoryRequest(token: string, name: string) {
  if (isDemoMode) {
    return demoApi.createCategory(name);
  }

  return apiRequest<{ category: CatalogEntity }>("/categories", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

export async function listBrandsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listBrands();
  }

  return apiRequest<{ brands: CatalogEntity[] }>("/brands", {
    headers: authHeaders(token),
  });
}

export async function createBrandRequest(token: string, name: string) {
  if (isDemoMode) {
    return demoApi.createBrand(name);
  }

  return apiRequest<{ brand: CatalogEntity }>("/brands", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

export async function listSupportTicketsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listSupportTickets();
  }

  return apiRequest<{ tickets: SupportTicket[] }>("/support/tickets", {
    headers: authHeaders(token),
  });
}

export async function smartSearchRequest(token: string, query: string) {
  if (isDemoMode) {
    return demoApi.smartSearch(query);
  }

  return apiRequest<SmartSearchResponse>(`/search${queryString({ q: query })}`, {
    headers: authHeaders(token),
  });
}

export async function listPurchaseOrdersRequest(
  token: string,
  filters: PurchaseOrderFilters = {},
) {
  if (isDemoMode) {
    return demoApi.listPurchaseOrders(filters);
  }

  return apiRequest<{ orders: PurchaseOrder[] }>(`/purchase-orders${queryString(filters)}`, {
    headers: authHeaders(token),
  });
}

export async function createPurchaseOrderRequest(token: string, payload: PurchaseOrderPayload) {
  if (isDemoMode) {
    return demoApi.createPurchaseOrder(payload);
  }

  return apiRequest<{ order: PurchaseOrder }>("/purchase-orders", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updatePurchaseOrderStatusRequest(
  token: string,
  id: string,
  status: PurchaseOrderStatus,
) {
  if (isDemoMode) {
    return demoApi.updatePurchaseOrderStatus(id, status);
  }

  return apiRequest<{ order: PurchaseOrder }>(`/purchase-orders/${id}/status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export async function listQuoteRequestsRequest(token: string, filters: QuoteRequestFilters = {}) {
  if (isDemoMode) {
    return demoApi.listQuoteRequests(filters);
  }

  return apiRequest<{ requests: QuoteRequest[] }>(`/quote-requests${queryString(filters)}`, {
    headers: authHeaders(token),
  });
}

export async function createQuoteRequestRequest(token: string, payload: QuoteRequestPayload, attachments: File[] = []) {
  if (isDemoMode) {
    return demoApi.createQuoteRequest(payload, attachments);
  }

  const formData = new FormData();
  formData.set("data", JSON.stringify(payload));
  attachments.forEach((file) => formData.append("attachments", file));

  const response = await fetch(`${API_BASE_URL}/quote-requests`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No pudimos crear la solicitud de cotización.");
  }

  return data as { request: QuoteRequest };
}

export async function getQuoteRequestRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.getQuoteRequest(id);
  }

  return apiRequest<{ request: QuoteRequest }>(`/quote-requests/${id}`, {
    headers: authHeaders(token),
  });
}

export async function getPriceHistoryRequest(
  token: string,
  filters: { itemId?: string; supplierId?: string } = {},
) {
  if (isDemoMode) {
    return demoApi.getPriceHistory(filters);
  }

  return apiRequest<PriceHistoryResponse>(`/price-history${queryString(filters)}`, {
    headers: authHeaders(token),
  });
}

export async function getReportsSummaryRequest(token: string) {
  if (isDemoMode) {
    return demoApi.getReportsSummary();
  }

  return apiRequest<ReportsSummaryResponse>("/reports/summary", {
    headers: authHeaders(token),
  });
}

export async function listAiDocumentsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listAiDocuments();
  }

  return apiRequest<{ documents: AiDocumentSummary[] }>("/ai-consult/documents", {
    headers: authHeaders(token),
  });
}

export async function listAiChatsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listAiChats();
  }

  return apiRequest<{ chats: AiChatSummary[] }>("/ai-consult/chats", {
    headers: authHeaders(token),
  });
}

export async function createAiChatRequest(token: string, title: string) {
  if (isDemoMode) {
    return demoApi.createAiChat(title);
  }

  return apiRequest<{ chat: AiChatSummary }>("/ai-consult/chats", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
}

export async function getAiChatRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.getAiChat(id);
  }

  return apiRequest<{ chat: AiChatDetail }>(`/ai-consult/chats/${id}`, {
    headers: authHeaders(token),
  });
}

export async function deleteAiChatRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.deleteAiChat(id);
  }

  return apiRequest<{ chat: { id: string } }>(`/ai-consult/chats/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function uploadAiDocumentRequest(token: string, file: File) {
  if (isDemoMode) {
    return demoApi.uploadAiDocument(file);
  }

  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`${API_BASE_URL}/ai-consult/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No pudimos importar el documento.");
  }

  return data as { document: AiDocumentSummary };
}

export async function uploadAiChatDocumentRequest(token: string, chatId: string, file: File) {
  if (isDemoMode) {
    return demoApi.uploadAiChatDocument(chatId, file);
  }

  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`${API_BASE_URL}/ai-consult/chats/${chatId}/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No pudimos importar el documento.");
  }

  return data as { document: AiDocumentSummary };
}

export async function deleteAiDocumentRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.deleteAiDocument(id);
  }

  return apiRequest<{ document: { id: string; chatId: string | null } }>(`/ai-consult/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function getAiDocumentRequest(token: string, id: string) {
  if (isDemoMode) {
    return demoApi.getAiDocument(id);
  }

  return apiRequest<{ document: AiDocumentDetail }>(`/ai-consult/documents/${id}`, {
    headers: authHeaders(token),
  });
}

export async function askAiDocumentRequest(token: string, id: string | null, question: string) {
  if (isDemoMode) {
    return demoApi.askAiDocument(id ?? "all", question);
  }

  const path = id ? `/ai-consult/documents/${id}/questions` : "/ai-consult/questions";

  return apiRequest<{ answer: AiQuestionAnswer }>(path, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ question }),
  });
}

export async function askAiChatRequest(token: string, chatId: string, question: string) {
  if (isDemoMode) {
    return demoApi.askAiChat(chatId, question);
  }

  return apiRequest<{ answer: AiQuestionAnswer }>(`/ai-consult/chats/${chatId}/questions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ question }),
  });
}

export async function getOrganizationWorkspaceRequest(token: string) {
  if (isDemoMode) {
    return demoApi.getOrganizationWorkspace();
  }

  return apiRequest<OrganizationWorkspaceResponse>("/organizations", {
    headers: authHeaders(token),
  });
}

export async function createSupportTicketRequest(
  token: string,
  payload: { subject: string; category: string; priority: string; message: string },
) {
  if (isDemoMode) {
    return demoApi.createSupportTicket(payload);
  }

  return apiRequest<{ ticket: SupportTicket }>("/support/tickets", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function getAdminOverviewRequest(token: string) {
  if (isDemoMode) {
    return demoApi.getAdminOverview();
  }

  return apiRequest<{ overview: AdminOverview }>("/admin/overview", {
    headers: authHeaders(token),
  });
}

export async function listAdminOrganizationsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listAdminOrganizations();
  }

  return apiRequest<{ organizations: Array<{ id: string; name: string; plan: string; accountType: string; _count: { users: number; suppliers: number; supportTickets: number } }> }>("/admin/organizations", {
    headers: authHeaders(token),
  });
}

export async function listAdminSupportTicketsRequest(token: string) {
  if (isDemoMode) {
    return demoApi.listAdminSupportTickets();
  }

  return apiRequest<{ tickets: SupportTicket[] }>("/admin/support-tickets", {
    headers: authHeaders(token),
  });
}

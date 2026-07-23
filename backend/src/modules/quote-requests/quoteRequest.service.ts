import type { z } from "zod";
import { prisma } from "../../lib/prisma";
import { parseUploadedDocument } from "../ai-consult/aiConsult.service";
import type { createQuoteRequestSchema, createSupplierQuoteSchema, listQuoteRequestsQuerySchema } from "./quoteRequest.schema";

type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
type CreateSupplierQuoteInput = z.infer<typeof createSupplierQuoteSchema>;
type ListQuoteRequestsQuery = z.infer<typeof listQuoteRequestsQuerySchema>;

type RequestItemForAnalysis = {
  id: string;
  lineNumber: number;
  description: string;
  quantity: string;
  unit: string;
  technicalSpecs: string | null;
};

type ExtractedQuoteLine = {
  description: string;
  quantity?: number | null;
  unit?: string | null;
  brand?: string | null;
  model?: string | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  tax?: number | null;
  leadTime?: string | null;
  warranty?: string | null;
  availability?: string | null;
  observations?: string | null;
  rawText?: string | null;
};

const quoteRequestInclude = {
  requester: { select: { id: true, name: true, email: true } },
  items: { orderBy: { lineNumber: "asc" as const } },
  attachments: {
    orderBy: { createdAt: "desc" as const },
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
  },
  suppliers: {
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          rnc: true,
          category: true,
          city: true,
          phone: true,
          email: true,
          rating: true,
          contacts: {
            orderBy: [{ isPrimary: "desc" as const }, { name: "asc" as const }],
            take: 3,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  emailLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 30,
  },
  quotes: {
    include: {
      supplier: {
        select: { id: true, name: true, rnc: true, category: true, city: true, phone: true, email: true, rating: true },
      },
      lines: { orderBy: { createdAt: "asc" as const } },
    },
    orderBy: { receivedAt: "desc" as const },
  },
};

function cleanString(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function decimalString(value: number) {
  return Number(value.toFixed(2)).toFixed(2);
}

function nullableDecimal(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? decimalString(value) : null;
}

function decimalNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapQuoteRequest(request: any) {
  const items = request.items.map(mapRequestItem);
  const quotes = (request.quotes ?? []).map(mapSupplierQuote);

  return {
    id: request.id,
    number: request.number,
    status: request.status,
    project: request.project,
    costCenter: request.costCenter,
    requesterName: request.requesterName,
    deadline: request.deadline,
    observations: request.observations,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    requester: request.requester,
    items,
    attachments: request.attachments,
    suppliers: (request.suppliers ?? []).map((entry: any) => ({
      id: entry.id,
      supplierId: entry.supplierId,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail,
      contactPhone: entry.contactPhone,
      createdAt: entry.createdAt,
      supplier: entry.supplier,
    })),
    emailLogs: (request.emailLogs ?? []).map((log: any) => ({
      id: log.id,
      supplierId: log.supplierId,
      recipientName: log.recipientName,
      recipientEmail: log.recipientEmail,
      subject: log.subject,
      body: log.body,
      status: log.status,
      createdAt: log.createdAt,
    })),
    quotes,
    comparison: buildComparison(items, request.suppliers ?? [], quotes),
    itemCount: items.length,
    attachmentCount: request.attachments.length,
    supplierCount: request.suppliers?.length ?? 0,
    quoteCount: quotes.length,
  };
}

function mapRequestItem(item: any): RequestItemForAnalysis {
  return {
    id: item.id,
    lineNumber: item.lineNumber,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    technicalSpecs: item.technicalSpecs,
  };
}

function mapSupplierQuote(quote: any) {
  return {
    id: quote.id,
    quoteRequestId: quote.quoteRequestId,
    supplierId: quote.supplierId,
    supplier: quote.supplier,
    receivedAt: quote.receivedAt,
    fileName: quote.fileName,
    mimeType: quote.mimeType,
    sizeBytes: quote.sizeBytes,
    observations: quote.observations,
    reviewStatus: quote.reviewStatus,
    analysis: quote.analysisJson,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    lines: quote.lines.map((line: any) => ({
      id: line.id,
      quoteRequestItemId: line.quoteRequestItemId,
      description: line.description,
      quantity: line.quantity?.toString() ?? null,
      unit: line.unit,
      brand: line.brand,
      model: line.model,
      unitPrice: line.unitPrice?.toString() ?? null,
      totalPrice: line.totalPrice?.toString() ?? null,
      tax: line.tax?.toString() ?? null,
      leadTime: line.leadTime,
      warranty: line.warranty,
      availability: line.availability,
      observations: line.observations,
      matchScore: line.matchScore,
      differences: line.differences,
      rawText: line.rawText,
    })),
  };
}

async function nextQuoteRequestNumber(tx: any) {
  const year = new Date().getFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const baseCount = await tx.quoteRequest.count({ where: { createdAt: { gte: start, lt: end } } });

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const number = `SC-${year}-${String(baseCount + attempt).padStart(5, "0")}`;
    const existing = await tx.quoteRequest.findUnique({ where: { number } });
    if (!existing) {
      return number;
    }
  }

  return `SC-${year}-${Date.now()}`;
}

function parseDeadline(value?: string) {
  const cleaned = cleanString(value);
  return cleaned ? new Date(`${cleaned}T23:59:59.999Z`) : undefined;
}

function parseOptionalDate(value?: string) {
  const cleaned = cleanString(value);
  return cleaned ? new Date(cleaned) : undefined;
}

async function ensureSupplierIds(organizationId: string, supplierIds: string[]) {
  const uniqueIds = Array.from(new Set(supplierIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return [];
  }

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: uniqueIds }, organizationId, isActive: true },
    include: {
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        take: 1,
      },
    },
  });

  if (suppliers.length !== uniqueIds.length) {
    const error = new Error("Uno o más suplidores seleccionados no son válidos.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  return suppliers;
}

async function ensureQuoteRequest(organizationId: string, id: string) {
  const request = await prisma.quoteRequest.findFirst({
    where: { id, organizationId },
    include: quoteRequestInclude,
  });

  if (!request) {
    const error = new Error("Solicitud de cotización no encontrada.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return request;
}

export async function listQuoteRequests(organizationId: string, query: ListQuoteRequestsQuery) {
  const search = cleanString(query.search);
  const requests = await prisma.quoteRequest.findMany({
    where: {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" as const } },
              { project: { contains: search, mode: "insensitive" as const } },
              { costCenter: { contains: search, mode: "insensitive" as const } },
              { requesterName: { contains: search, mode: "insensitive" as const } },
              { observations: { contains: search, mode: "insensitive" as const } },
              { suppliers: { some: { supplier: { name: { contains: search, mode: "insensitive" as const } } } } },
              { items: { some: { description: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    },
    include: quoteRequestInclude,
    orderBy: { createdAt: "desc" },
  });

  return requests.map(mapQuoteRequest);
}

export async function getQuoteRequest(organizationId: string, id: string) {
  return mapQuoteRequest(await ensureQuoteRequest(organizationId, id));
}

export async function createQuoteRequest(
  organizationId: string,
  requesterId: string | null,
  input: CreateQuoteRequestInput,
  attachments: Express.Multer.File[] = [],
) {
  const [requester, suppliers] = await Promise.all([
    requesterId
      ? prisma.user.findFirst({ where: { id: requesterId, organizationId }, select: { name: true } })
      : Promise.resolve(null),
    ensureSupplierIds(organizationId, input.supplierIds ?? []),
  ]);

  const request = await prisma.$transaction(async (tx) => {
    const number = await nextQuoteRequestNumber(tx);

    return tx.quoteRequest.create({
      data: {
        organizationId,
        requesterId,
        number,
        project: input.project.trim(),
        costCenter: cleanString(input.costCenter),
        requesterName: cleanString(input.requesterName) ?? requester?.name ?? "Solicitante",
        deadline: parseDeadline(input.deadline),
        observations: cleanString(input.observations),
        suppliers: {
          create: suppliers.map((supplier) => {
            const contact = supplier.contacts[0];
            return {
              supplierId: supplier.id,
              contactName: contact?.name ?? null,
              contactEmail: contact?.email ?? supplier.email,
              contactPhone: contact?.phone ?? supplier.phone,
            };
          }),
        },
        items: {
          create: input.items.map((item, index) => ({
            lineNumber: index + 1,
            description: item.description.trim(),
            quantity: decimalString(item.quantity),
            unit: item.unit.trim(),
            technicalSpecs: cleanString(item.technicalSpecs),
          })),
        },
        attachments: {
          create: attachments.map((file) => ({
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            content: new Uint8Array(file.buffer) as any,
          })),
        },
      },
      include: quoteRequestInclude,
    });
  });

  return mapQuoteRequest(request);
}

export async function generateSupplierEmail(organizationId: string, quoteRequestId: string, supplierId: string) {
  const request = await ensureQuoteRequest(organizationId, quoteRequestId);
  const selectedSupplier = request.suppliers.find((entry: any) => entry.supplierId === supplierId);

  if (!selectedSupplier) {
    const error = new Error("Ese suplidor no está seleccionado en esta solicitud.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const recipientEmail = selectedSupplier.contactEmail ?? selectedSupplier.supplier.email;
  if (!recipientEmail) {
    const error = new Error("Este suplidor no tiene correo registrado.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const subject = `Solicitud de cotización ${request.number} - ${request.project}`;
  const body = buildEmailBody(request, selectedSupplier);
  const log = await prisma.quoteRequestEmailLog.create({
    data: {
      quoteRequestId,
      supplierId,
      recipientName: selectedSupplier.contactName ?? selectedSupplier.supplier.name,
      recipientEmail,
      subject,
      body,
      status: "GENERADO",
    },
  });

  if (request.status === "BORRADOR") {
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: "LISTA_PARA_ENVIAR" },
    });
  }

  return {
    emailLog: log,
    mailtoUrl: `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}

export async function registerSupplierQuote(
  organizationId: string,
  quoteRequestId: string,
  input: CreateSupplierQuoteInput,
  file: Express.Multer.File,
) {
  const request = await ensureQuoteRequest(organizationId, quoteRequestId);
  await ensureSupplierIds(organizationId, [input.supplierId]);

  const selectedSupplier = request.suppliers.find((entry: any) => entry.supplierId === input.supplierId);
  if (!selectedSupplier) {
    const error = new Error("El suplidor debe estar seleccionado en la solicitud antes de registrar su cotización.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const parsed = await parseUploadedDocument(file);
  const requestItems = request.items.map(mapRequestItem);
  const extractedLines = analyzeQuoteLines(parsed.text, parsed.structured as any, requestItems);

  const quote = await prisma.supplierQuote.create({
    data: {
      quoteRequestId,
      supplierId: input.supplierId,
      receivedAt: parseOptionalDate(input.receivedAt),
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      content: new Uint8Array(file.buffer) as any,
      observations: cleanString(input.observations),
      reviewStatus: extractedLines.length ? "ANALIZADA" : "EN_REVISION",
      extractedText: parsed.text,
      analysisJson: {
        mode: "smart-source-parser",
        summary: parsed.summary,
        detectedLines: extractedLines.length,
        requestNumber: request.number,
      },
      lines: {
        create: extractedLines.map((line) => {
          const match = matchRequestItem(line, requestItems);
          return {
            quoteRequestItemId: match.item?.id ?? null,
            description: line.description,
            quantity: nullableDecimal(line.quantity),
            unit: cleanString(line.unit),
            brand: cleanString(line.brand),
            model: cleanString(line.model),
            unitPrice: nullableDecimal(line.unitPrice),
            totalPrice: nullableDecimal(line.totalPrice),
            tax: nullableDecimal(line.tax),
            leadTime: cleanString(line.leadTime),
            warranty: cleanString(line.warranty),
            availability: cleanString(line.availability),
            observations: cleanString(line.observations),
            matchScore: match.score,
            differences: match.differences,
            rawText: cleanString(line.rawText),
          };
        }),
      },
    },
    include: {
      supplier: { select: { id: true, name: true, rnc: true, category: true, city: true, phone: true, email: true, rating: true } },
      lines: { orderBy: { createdAt: "asc" } },
    },
  });

  await prisma.quoteRequest.update({
    where: { id: quoteRequestId },
    data: { status: "RECIBIENDO_COTIZACIONES" },
  });

  return mapSupplierQuote(quote);
}

function buildEmailBody(request: any, selectedSupplier: any) {
  const deadline = request.deadline ? new Date(request.deadline).toLocaleDateString("es-DO") : "la fecha indicada";
  const greeting = selectedSupplier.contactName ? `Saludos ${selectedSupplier.contactName},` : "Saludos,";
  const items = request.items
    .map((item: any) => {
      const specs = item.technicalSpecs ? `\n   Especificaciones: ${item.technicalSpecs}` : "";
      return `${item.lineNumber}. ${item.description} - ${item.quantity.toString()} ${item.unit}${specs}`;
    })
    .join("\n");
  const attachments = request.attachments.length
    ? `\n\nAdjuntos de referencia: ${request.attachments.map((attachment: any) => attachment.fileName).join(", ")}.`
    : "";

  return `${greeting}

Por esta vía solicitamos su cotización para la solicitud ${request.number}.

Proyecto/Centro: ${request.project}
Centro de costo: ${request.costCenter ?? "N/A"}
Fecha límite de respuesta: ${deadline}

Detalle solicitado:
${items}

Observaciones:
${request.observations ?? "Sin observaciones adicionales."}${attachments}

Favor incluir precio unitario, precio total, marca, modelo, garantía, disponibilidad y tiempo de entrega.

Gracias,
Smart Source`;
}

function analyzeQuoteLines(text: string, structured: any, requestItems: RequestItemForAnalysis[]) {
  const tableLines = extractTableQuoteLines(structured);
  if (tableLines.length) {
    return tableLines;
  }

  return extractTextQuoteLines(text, requestItems);
}

function extractTableQuoteLines(structured: any): ExtractedQuoteLine[] {
  const sheets = structured?.sheets ?? [];
  const lines: ExtractedQuoteLine[] = [];

  for (const sheet of sheets) {
    const columns = sheet.columns ?? [];
    const descriptionColumn = findColumn(columns, ["descripcion", "descripción", "producto", "item", "material", "servicio", "concepto", "detalle"]);
    const quantityColumn = findColumn(columns, ["cantidad", "cant", "qty"]);
    const unitColumn = findColumn(columns, ["unidad", "und", "um", "u/m"]);
    const brandColumn = findColumn(columns, ["marca"]);
    const modelColumn = findColumn(columns, ["modelo", "referencia"]);
    const unitPriceColumn = findColumn(columns, ["precio unitario", "unitario", "precio", "costo"]);
    const totalPriceColumn = findColumn(columns, ["precio total", "total", "importe", "monto", "subtotal"]);
    const taxColumn = findColumn(columns, ["itbis", "impuesto", "tax"]);
    const leadColumn = findColumn(columns, ["entrega", "tiempo", "lead"]);
    const warrantyColumn = findColumn(columns, ["garantia", "garantía"]);
    const availabilityColumn = findColumn(columns, ["disponibilidad", "stock"]);
    const observationColumn = findColumn(columns, ["observacion", "observación", "notas", "comentario"]);

    if (!descriptionColumn) {
      continue;
    }

    for (const row of sheet.rows ?? []) {
      const description = cleanString(String(row[descriptionColumn] ?? ""));
      if (!description) {
        continue;
      }

      const quantity = parseNumber(row[quantityColumn]);
      const unitPrice = parseNumber(row[unitPriceColumn]);
      const totalPrice = parseNumber(row[totalPriceColumn]) ?? (quantity && unitPrice ? quantity * unitPrice : null);

      lines.push({
        description,
        quantity,
        unit: cleanString(String(row[unitColumn] ?? "")),
        brand: cleanString(String(row[brandColumn] ?? "")),
        model: cleanString(String(row[modelColumn] ?? "")),
        unitPrice,
        totalPrice,
        tax: parseNumber(row[taxColumn]),
        leadTime: cleanString(String(row[leadColumn] ?? "")),
        warranty: cleanString(String(row[warrantyColumn] ?? "")),
        availability: cleanString(String(row[availabilityColumn] ?? "")),
        observations: cleanString(String(row[observationColumn] ?? "")),
        rawText: columns.map((column: string) => `${column}: ${row[column] ?? ""}`).join(" | "),
      });
    }
  }

  return lines.filter((line) => line.unitPrice || line.totalPrice || line.description.length > 4).slice(0, 200);
}

function extractTextQuoteLines(text: string, requestItems: RequestItemForAnalysis[]): ExtractedQuoteLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 5 && line.length <= 500);

  const result: ExtractedQuoteLine[] = [];

  for (const requestItem of requestItems) {
    const scored = lines
      .map((line) => ({ line, score: similarity(requestItem.description, line) }))
      .filter((entry) => entry.score >= 20)
      .sort((a, b) => b.score - a.score);
    const best = scored[0]?.line;
    if (!best) {
      continue;
    }

    const moneyValues = extractMoneyValues(best);
    const quantity = extractQuantityNear(best) ?? decimalNumber(requestItem.quantity);
    result.push({
      description: cleanTextDescription(best, requestItem.description),
      quantity,
      unit: requestItem.unit,
      unitPrice: moneyValues[0] ?? null,
      totalPrice: moneyValues.length > 1 ? moneyValues[moneyValues.length - 1] : (moneyValues[0] && quantity ? moneyValues[0] * quantity : null),
      rawText: best,
    });
  }

  return result;
}

function findColumn(columns: string[], hints: string[]) {
  return columns.find((column) => hints.some((hint) => normalize(column).includes(normalize(hint)))) ?? "";
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const numericText = raw.replace(/[^\d,.-]/g, "").trim();
  if (!/\d/.test(numericText)) {
    return null;
  }

  const normalized = numericText
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/,(?=\d{1,2}$)/, ".")
    .replace(/,/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function extractMoneyValues(value: string) {
  return Array.from(value.matchAll(/(?:RD\$|DOP|US\$|USD|\$)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})?)/gi))
    .map((match) => parseNumber(match[0]))
    .filter((number): number is number => typeof number === "number" && number > 0);
}

function extractQuantityNear(value: string) {
  const match = value.match(/\b(\d+(?:[.,]\d+)?)\s*(und|unidad|unidades|metro|metros|m|caja|cajas|funda|fundas|servicio|hora|horas)\b/i);
  return match ? parseNumber(match[1]) : null;
}

function cleanTextDescription(value: string, fallback: string) {
  const cleaned = value.replace(/(?:RD\$|DOP|US\$|USD|\$)?\s*\d[\d.,]*/gi, "").replace(/\s+/g, " ").trim();
  return cleaned.length >= 4 ? cleaned.slice(0, 240) : fallback;
}

function matchRequestItem(line: ExtractedQuoteLine, items: RequestItemForAnalysis[]) {
  const scored = items
    .map((item) => ({
      item,
      score: Math.max(similarity(line.description, item.description), similarity(`${line.description} ${line.rawText ?? ""}`, `${item.description} ${item.technicalSpecs ?? ""}`)),
    }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const matched = best?.score >= 25 ? best.item : null;
  const differences = matched ? detectDifferences(line, matched) : "No se pudo relacionar con un ítem de la solicitud.";

  return {
    item: matched,
    score: best?.score ?? 0,
    differences,
  };
}

function detectDifferences(line: ExtractedQuoteLine, item: RequestItemForAnalysis) {
  const differences: string[] = [];
  const requestedQuantity = decimalNumber(item.quantity);

  if (line.quantity && requestedQuantity && Math.abs(line.quantity - requestedQuantity) > 0.01) {
    differences.push(`Cantidad ofertada ${line.quantity} vs solicitada ${requestedQuantity}.`);
  }

  if (line.unit && normalize(line.unit) !== normalize(item.unit)) {
    differences.push(`Unidad ofertada "${line.unit}" vs solicitada "${item.unit}".`);
  }

  return differences.join(" ") || null;
}

function normalize(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokens(value: string) {
  return normalize(value)
    .split(/[^a-z0-9ñ]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function similarity(a: string, b: string) {
  const aTokens = new Set(tokens(a));
  const bTokens = new Set(tokens(b));
  if (!aTokens.size || !bTokens.size) {
    return 0;
  }

  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return Math.round((overlap / Math.max(aTokens.size, bTokens.size)) * 100);
}

function buildComparison(items: RequestItemForAnalysis[], suppliers: any[], quotes: any[]) {
  const supplierColumns = suppliers.map((entry) => {
    const latestQuote = quotes.find((quote) => quote.supplierId === entry.supplierId);
    return {
      supplierId: entry.supplierId,
      supplierName: entry.supplier.name,
      rating: entry.supplier.rating ?? 0,
      quoteId: latestQuote?.id ?? null,
      quoteStatus: latestQuote?.reviewStatus ?? null,
    };
  });

  const rows = items.map((item) => {
    const offers = supplierColumns.map((supplier) => {
      const quote = quotes.find((entry) => entry.supplierId === supplier.supplierId);
      const line = quote?.lines.find((entry: any) => entry.quoteRequestItemId === item.id);
      const unitPrice = decimalNumber(line?.unitPrice);
      const totalPrice = decimalNumber(line?.totalPrice);
      const leadDays = parseLeadDays(line?.leadTime);

      return {
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        quoteId: quote?.id ?? null,
        lineId: line?.id ?? null,
        unitPrice,
        totalPrice,
        brand: line?.brand ?? null,
        model: line?.model ?? null,
        leadTime: line?.leadTime ?? null,
        leadDays,
        warranty: line?.warranty ?? null,
        availability: line?.availability ?? null,
        observations: line?.observations ?? null,
        differences: line?.differences ?? null,
        matchScore: line?.matchScore ?? null,
      };
    });

    const prices = offers.map((offer) => offer.totalPrice ?? offer.unitPrice).filter((price): price is number => typeof price === "number");
    const leadValues = offers.map((offer) => offer.leadDays).filter((lead): lead is number => typeof lead === "number");
    const bestPrice = prices.length ? Math.min(...prices) : null;
    const bestLeadDays = leadValues.length ? Math.min(...leadValues) : null;

    return {
      item,
      offers: offers.map((offer) => ({
        ...offer,
        isBestPrice: bestPrice !== null && (offer.totalPrice ?? offer.unitPrice) === bestPrice,
        isBestDelivery: bestLeadDays !== null && offer.leadDays === bestLeadDays,
      })),
    };
  });

  return {
    suppliers: supplierColumns,
    rows,
  };
}

function parseLeadDays(value?: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

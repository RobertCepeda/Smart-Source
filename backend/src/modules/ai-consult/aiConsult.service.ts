import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type SheetData = {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

type StructuredDocument = {
  kind: "table" | "json" | "text";
  sheets?: SheetData[];
  preview?: unknown;
};

type ParsedDocument = {
  text: string;
  structured: StructuredDocument;
  summary: string;
};

type QuoteDocument = {
  id: string;
  fileName: string;
  extractedText: string;
  structured: StructuredDocument | null;
};

type QuoteLine = {
  documentId: string;
  fileName: string;
  company: string;
  product: string;
  productKey: string;
  price: number;
  currency: string;
  source: string;
};

type ProductAlias = {
  canonicalName: string;
  aliasName: string;
  confidence: number;
};

const MAX_TEXT_LENGTH = 240_000;
const MAX_ROWS_PER_SHEET = 700;
const MAX_SHEETS = 12;
const productColumnHints = ["producto", "item", "articulo", "descripcion", "material", "servicio", "concepto", "detalle"];
const companyColumnHints = ["empresa", "suplidor", "proveedor", "vendor", "compania", "cotizador"];
const priceColumnHints = ["precio", "unitario", "costo", "total", "monto", "importe", "valor", "subtotal"];
const numericColumnRejects = ["cantidad", "qty", "rnc", "telefono", "phone", "codigo", "numero", "fecha", "dias"];
const stopWords = new Set([
  "a",
  "al",
  "algo",
  "cual",
  "cuál",
  "cuando",
  "de",
  "del",
  "dame",
  "dime",
  "el",
  "en",
  "es",
  "esa",
  "ese",
  "esto",
  "la",
  "las",
  "le",
  "lo",
  "los",
  "me",
  "para",
  "por",
  "que",
  "qué",
  "quiero",
  "saber",
  "si",
  "tal",
  "un",
  "una",
  "barata",
  "barato",
  "comparar",
  "cotizacion",
  "cotizaciones",
  "empresa",
  "empresas",
  "mas",
  "mayor",
  "menor",
  "monto",
  "precio",
  "producto",
  "productos",
  "vende",
  "venden",
  "vendiendo",
  "ver",
  "y",
]);

function cleanText(value: string) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function limitText(value: string) {
  const cleaned = cleanText(value);
  return cleaned.length > MAX_TEXT_LENGTH ? `${cleaned.slice(0, MAX_TEXT_LENGTH)}\n\n[Texto truncado para análisis]` : cleaned;
}

function extensionOf(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokens(value: string) {
  return normalize(value)
    .split(/[^a-z0-9ñ]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const numericText = raw
    .replace(/[^\d,.-]/g, "")
    .trim();

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

function rowsToText(sheets: SheetData[]) {
  return sheets
    .map((sheet) => {
      const header = `Hoja: ${sheet.name}\nColumnas: ${sheet.columns.join(" | ")}`;
      const rows = sheet.rows
        .slice(0, 120)
        .map((row, index) => {
          const values = sheet.columns.map((column) => `${column}: ${String(row[column] ?? "")}`).join(" | ");
          return `Fila ${index + 1}: ${values}`;
        })
        .join("\n");
      return `${header}\n${rows}`;
    })
    .join("\n\n");
}

function workbookToSheets(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  return workbook.SheetNames.slice(0, MAX_SHEETS).map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    }).slice(0, MAX_ROWS_PER_SHEET);
    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    return { name: sheetName, columns, rows };
  });
}

function jsonToText(value: unknown, level = 0): string {
  if (level > 5) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 300).map((item, index) => `Registro ${index + 1}: ${jsonToText(item, level + 1)}`).join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .slice(0, 80)
      .map(([key, entry]) => `${key}: ${typeof entry === "object" ? jsonToText(entry, level + 1) : String(entry ?? "")}`)
      .join(" | ");
  }

  return String(value ?? "");
}

function createSummary(parsed: Pick<ParsedDocument, "text" | "structured">, fileName: string) {
  if (parsed.structured.kind === "table" && parsed.structured.sheets?.length) {
    const sheetLines = parsed.structured.sheets.map((sheet) => {
      const numericColumns = sheet.columns.filter((column) =>
        sheet.rows.some((row) => parseNumber(row[column]) !== null),
      );
      return `${sheet.name}: ${sheet.rows.length} filas, ${sheet.columns.length} columnas${numericColumns.length ? `, numéricas: ${numericColumns.slice(0, 6).join(", ")}` : ""}`;
    });

    return `Archivo "${fileName}" leído como tabla. ${sheetLines.join(" | ")}`;
  }

  const wordCount = parsed.text.split(/\s+/).filter(Boolean).length;
  const lineCount = parsed.text.split("\n").filter((line) => line.trim()).length;
  return `Archivo "${fileName}" leído correctamente. Contiene aproximadamente ${wordCount} palabras en ${lineCount} líneas.`;
}

export async function parseUploadedDocument(file: Express.Multer.File): Promise<ParsedDocument> {
  const extension = extensionOf(file.originalname);

  if (["xlsx", "xls", "csv"].includes(extension)) {
    const sheets = workbookToSheets(file.buffer);
    const text = limitText(rowsToText(sheets));
    const structured: StructuredDocument = { kind: "table", sheets };
    return { text, structured, summary: createSummary({ text, structured }, file.originalname) };
  }

  if (extension === "json" || file.mimetype.includes("json")) {
    const parsed = JSON.parse(file.buffer.toString("utf8"));
    const text = limitText(jsonToText(parsed));
    const structured: StructuredDocument = { kind: "json", preview: parsed };
    return { text, structured, summary: createSummary({ text, structured }, file.originalname) };
  }

  if (extension === "pdf" || file.mimetype.includes("pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
    try {
      const parsed = await parser.getText();
      const text = limitText(parsed.text || "");
      const structured: StructuredDocument = { kind: "text" };
      return { text, structured, summary: createSummary({ text, structured }, file.originalname) };
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    const text = limitText(parsed.value || "");
    const structured: StructuredDocument = { kind: "text" };
    return { text, structured, summary: createSummary({ text, structured }, file.originalname) };
  }

  const text = limitText(file.buffer.toString("utf8"));
  const structured: StructuredDocument = { kind: "text" };
  return { text, structured, summary: createSummary({ text, structured }, file.originalname) };
}

export async function createAiDocument(
  organizationId: string,
  uploadedById: string | null,
  file: Express.Multer.File,
  chatId: string | null = null,
) {
  const parsed = await parseUploadedDocument(file);
  const extension = extensionOf(file.originalname);

  const document = await prisma.aiDocument.create({
    data: {
      organizationId,
      chatId,
      uploadedById,
      fileName: file.originalname,
      mimeType: file.mimetype,
      extension,
      sizeBytes: file.size,
      extractedText: parsed.text,
      structuredJson: toJson(parsed.structured),
      summary: parsed.summary,
    },
    include: { _count: { select: { questions: true } } },
  });

  return mapDocument(document);
}

export async function listAiDocuments(organizationId: string) {
  const documents = await prisma.aiDocument.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return documents.map(mapDocument);
}

export async function listAiChats(organizationId: string) {
  const chats = await prisma.aiChat.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { documents: true, questions: true } },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { fileName: true },
      },
    },
  });

  return chats.map(mapChat);
}

export async function createAiChat(organizationId: string, createdById: string | null, title: string) {
  const chat = await prisma.aiChat.create({
    data: {
      organizationId,
      createdById,
      title: title.trim() || defaultChatTitle(),
    },
    include: {
      _count: { select: { documents: true, questions: true } },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { fileName: true },
      },
    },
  });

  return mapChat(chat);
}

export async function getAiChat(organizationId: string, chatId: string) {
  const chat = await prisma.aiChat.findFirst({
    where: { id: chatId, organizationId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { questions: true } } },
      },
      questions: {
        orderBy: { createdAt: "asc" },
        take: 120,
      },
      _count: { select: { documents: true, questions: true } },
    },
  });

  if (!chat) {
    const error = new Error("Chat no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return {
    ...mapChat(chat),
    documents: chat.documents.map(mapDocument),
    questions: chat.questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      context: question.context,
      createdAt: question.createdAt,
    })),
  };
}

export async function uploadAiChatDocument(
  organizationId: string,
  chatId: string,
  uploadedById: string | null,
  file: Express.Multer.File,
) {
  await ensureAiChat(organizationId, chatId);
  const document = await createAiDocument(organizationId, uploadedById, file, chatId);
  await prisma.aiChat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
  return document;
}

export async function getAiDocument(organizationId: string, id: string) {
  const document = await prisma.aiDocument.findFirst({
    where: { id, organizationId },
    include: {
      questions: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { questions: true } },
    },
  });

  if (!document) {
    const error = new Error("Documento no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  return {
    ...mapDocument(document),
    extractedTextPreview: document.extractedText.slice(0, 1800),
    questions: document.questions.map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      createdAt: question.createdAt,
    })),
  };
}

export async function deleteAiDocument(organizationId: string, id: string) {
  const document = await prisma.aiDocument.findFirst({
    where: { id, organizationId },
    select: { id: true, chatId: true },
  });

  if (!document) {
    const error = new Error("Documento no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  if (document.chatId) {
    const fallbackDocument = await prisma.aiDocument.findFirst({
      where: { organizationId, chatId: document.chatId, id: { not: id } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (fallbackDocument) {
      await prisma.aiQuestion.updateMany({
        where: { documentId: id },
        data: { documentId: fallbackDocument.id },
      });
    }
  }

  await prisma.aiDocument.delete({ where: { id } });

  if (document.chatId) {
    await prisma.aiChat.update({ where: { id: document.chatId }, data: { updatedAt: new Date() } });
  }

  return { id, chatId: document.chatId };
}

export async function askAiDocument(
  organizationId: string,
  documentId: string,
  askedById: string | null,
  question: string,
) {
  const document = await prisma.aiDocument.findFirst({
    where: { id: documentId, organizationId },
  });

  if (!document) {
    const error = new Error("Documento no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const result = answerFromDocument(document.extractedText, document.structuredJson as unknown as StructuredDocument | null, question);
  const saved = await prisma.aiQuestion.create({
    data: {
      documentId,
      chatId: document.chatId,
      askedById,
      question,
      answer: result.answer,
      context: toJson(result.context),
    },
  });

  return {
    id: saved.id,
    question: saved.question,
    answer: saved.answer,
    context: result.context,
    createdAt: saved.createdAt,
  };
}

export async function askAiWorkspace(organizationId: string, askedById: string | null, question: string) {
  const documents = await prisma.aiDocument.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  if (!documents.length) {
    const error = new Error("Sube una cotización o reporte antes de preguntar.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const result = await answerAcrossDocuments(
    organizationId,
    documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      extractedText: document.extractedText,
      structured: document.structuredJson as unknown as StructuredDocument | null,
    })),
    question,
  );

  const saved = await prisma.aiQuestion.create({
    data: {
      documentId: result.documentId ?? documents[0].id,
      askedById,
      question,
      answer: result.answer,
      context: toJson(result.context),
    },
  });

  return {
    id: saved.id,
    question: saved.question,
    answer: saved.answer,
    context: result.context,
    createdAt: saved.createdAt,
  };
}

export async function askAiChat(organizationId: string, chatId: string, askedById: string | null, question: string) {
  const chat = await prisma.aiChat.findFirst({
    where: { id: chatId, organizationId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!chat) {
    const error = new Error("Chat no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  if (!chat.documents.length) {
    const error = new Error("Sube cotizaciones a este chat antes de preguntar.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }

  const result = await answerAcrossDocuments(
    organizationId,
    chat.documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      extractedText: document.extractedText,
      structured: document.structuredJson as unknown as StructuredDocument | null,
    })),
    question,
  );

  const saved = await prisma.aiQuestion.create({
    data: {
      documentId: result.documentId ?? chat.documents[0].id,
      chatId,
      askedById,
      question,
      answer: result.answer,
      context: toJson(result.context),
    },
  });

  await prisma.aiChat.update({
    where: { id: chatId },
    data: { updatedAt: saved.createdAt },
  });

  return {
    id: saved.id,
    question: saved.question,
    answer: saved.answer,
    context: result.context,
    createdAt: saved.createdAt,
  };
}

function mapDocument(document: any) {
  const structured = document.structuredJson as unknown as StructuredDocument | null;
  const sheets = structured?.sheets ?? [];

  return {
    id: document.id,
    chatId: document.chatId ?? null,
    fileName: document.fileName,
    mimeType: document.mimeType,
    extension: document.extension,
    sizeBytes: document.sizeBytes,
    summary: document.summary,
    createdAt: document.createdAt,
    sheetCount: sheets.length,
    rowCount: sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    questionCount: document._count?.questions ?? 0,
  };
}

function mapChat(chat: any) {
  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    documentCount: chat._count?.documents ?? 0,
    questionCount: chat._count?.questions ?? 0,
    recentFiles: (chat.documents ?? []).map((document: { fileName: string }) => document.fileName),
  };
}

async function ensureAiChat(organizationId: string, chatId: string) {
  const chat = await prisma.aiChat.findFirst({
    where: { id: chatId, organizationId },
    select: { id: true },
  });

  if (!chat) {
    const error = new Error("Chat no encontrado.");
    (error as Error & { status: number }).status = 404;
    throw error;
  }
}

function defaultChatTitle() {
  return `Cotizaciones ${new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" }).format(new Date())}`;
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function answerFromDocument(text: string, structured: StructuredDocument | null, question: string) {
  const questionTokens = tokens(question);
  const tableAnswer = answerFromTables(structured, question, questionTokens);
  const snippets = findSnippets(text, questionTokens);
  const parts: string[] = [];

  if (tableAnswer) {
    parts.push(tableAnswer);
  }

  if (snippets.length) {
    parts.push(
      `Encontré estas partes relacionadas en el documento:\n${snippets
        .map((snippet, index) => `${index + 1}. ${snippet}`)
        .join("\n")}`,
    );
  }

  if (!parts.length) {
    parts.push("No encontré una respuesta directa en el documento. Prueba preguntando por una columna, monto, suplidor, fecha o concepto específico.");
  }

  return {
    answer: parts.join("\n\n"),
    context: { matchedTokens: questionTokens, snippets },
  };
}

async function answerAcrossDocuments(organizationId: string, documents: QuoteDocument[], question: string) {
  const storedAliases = await prisma.aiProductAlias.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
  const aliases: ProductAlias[] = storedAliases.map((alias) => ({
    canonicalName: alias.canonicalName,
    aliasName: alias.aliasName,
    confidence: alias.confidence,
  }));
  const quoteLines = documents.flatMap((document) => extractQuoteLines(document, aliases));
  const learnedAliases = discoverAliasCandidates(quoteLines, aliases);

  if (learnedAliases.length) {
    await saveProductAliases(organizationId, learnedAliases);
  }

  const allAliases = [...aliases, ...learnedAliases];
  const aliasedLines = quoteLines.map((line) => ({ ...line, productKey: productKeyFor(line.product, allAliases) }));
  const normalizedQuestion = normalize(question);
  const wantsPriceAnswer = /\b(barat|menor|precio|costo|cotiz|compar|vende|vendiendo|econom)/.test(normalizedQuestion);

  if (wantsPriceAnswer && aliasedLines.length) {
    return compareQuoteLines(aliasedLines, question, learnedAliases);
  }

  if (/\b(cuantos|cuantas|cantidad|archivos|documentos|cotizaciones)\b/.test(normalizedQuestion)) {
    return {
      documentId: documents[0]?.id,
      answer: `Tienes ${documents.length} documentos cargados y pude detectar ${aliasedLines.length} líneas de cotización para comparar.`,
      context: { documentCount: documents.length, quoteLineCount: aliasedLines.length },
    };
  }

  return fallbackWorkspaceAnswer(documents, question);
}

function extractQuoteLines(document: QuoteDocument, aliases: ProductAlias[]) {
  const lines: QuoteLine[] = [];

  if (document.structured?.sheets?.length) {
    for (const sheet of document.structured.sheets.slice(0, 8)) {
      const columns = sheet.columns.length ? sheet.columns : Array.from(new Set(sheet.rows.flatMap((row) => Object.keys(row))));
      const productColumn = findColumn(columns, productColumnHints);
      const companyColumn = findColumn(columns, companyColumnHints);

      for (const row of sheet.rows) {
        const product = productColumn ? cellText(row[productColumn]) : inferProductFromRow(row);
        const priceColumn = findPriceColumn(columns, row);
        const price = priceColumn ? parseNumber(row[priceColumn]) : null;

        if (!product || price === null || price <= 0) {
          continue;
        }

        lines.push({
          documentId: document.id,
          fileName: document.fileName,
          company: companyColumn ? cellText(row[companyColumn]) || supplierFromFileName(document.fileName) : supplierFromFileName(document.fileName),
          product,
          productKey: productKeyFor(product, aliases),
          price,
          currency: currencyFromText(`${cellText(row[priceColumn ?? ""])} ${document.extractedText}`),
          source: sheet.name,
        });
      }
    }
  }

  if (!lines.length) {
    lines.push(...extractQuoteLinesFromText(document, aliases));
  }

  return lines.slice(0, 350);
}

function extractQuoteLinesFromText(document: QuoteDocument, aliases: ProductAlias[]) {
  const lines: QuoteLine[] = [];
  const company = companyFromText(document.extractedText, document.fileName);
  const textLines = document.extractedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 8)
    .slice(0, 900);

  for (const line of textLines) {
    const matches = Array.from(line.matchAll(/(?:RD\$|US\$|USD|DOP|\$)?\s*\d[\d.,]*/gi));
    const match = matches.at(-1);
    const matchIndex = match?.index ?? -1;
    const price = match ? parseNumber(match[0]) : null;
    const product = matchIndex > 1 ? line.slice(0, matchIndex).replace(/[-:|]+$/g, "").trim() : "";

    if (!product || price === null || price <= 0 || product.length < 3 || /^\W*\d/.test(product)) {
      continue;
    }

    lines.push({
      documentId: document.id,
      fileName: document.fileName,
      company,
      product,
      productKey: productKeyFor(product, aliases),
      price,
      currency: currencyFromText(line),
      source: "texto",
    });
  }

  return lines.slice(0, 150);
}

function compareQuoteLines(quoteLines: QuoteLine[], question: string, learnedAliases: ProductAlias[]) {
  const requestedKeys = requestedProductKeys(quoteLines, question);
  const targetKeys = requestedKeys.length ? requestedKeys : Array.from(new Set(quoteLines.map((line) => line.productKey))).slice(0, 6);
  const answerLines: string[] = [];
  let mainDocumentId = quoteLines[0]?.documentId;

  if (!requestedKeys.length) {
    answerLines.push("No vi un producto específico en la pregunta. Te dejo el mejor precio detectado por producto:");
  }

  for (const key of targetKeys) {
    const matches = quoteLines
      .filter((line) => line.productKey === key)
      .sort((a, b) => a.price - b.price || a.company.localeCompare(b.company));

    if (!matches.length) {
      continue;
    }

    const best = matches[0];
    mainDocumentId = best.documentId;
    const productLabel = best.product;
    answerLines.push(
      `La opción más barata para "${productLabel}" es ${best.company}: ${best.currency} ${formatNumber(best.price)}.`,
    );
    answerLines.push(
      matches
        .slice(0, 5)
        .map((line, index) => `${index + 1}. ${line.company} - ${line.product} - ${line.currency} ${formatNumber(line.price)} - ${line.fileName}`)
        .join("\n"),
    );
  }

  const relevantAliases = learnedAliases
    .filter((alias) => targetKeys.includes(normalizeProductName(alias.canonicalName)) || targetKeys.includes(normalizeProductName(alias.aliasName)))
    .slice(0, 5);

  if (relevantAliases.length) {
    answerLines.push(
      `Guardé estas equivalencias para futuras consultas: ${relevantAliases
        .map((alias) => `"${alias.aliasName}" = "${alias.canonicalName}"`)
        .join(", ")}.`,
    );
  }

  return {
    documentId: mainDocumentId,
    answer: answerLines.join("\n\n"),
    context: {
      requestedKeys,
      comparedRows: quoteLines.length,
      learnedAliases: relevantAliases,
    },
  };
}

function fallbackWorkspaceAnswer(documents: QuoteDocument[], question: string) {
  const questionTokens = tokens(question);
  const scoredDocuments = documents
    .map((document) => ({
      document,
      score: questionTokens.reduce((total, token) => total + (normalize(document.extractedText).includes(token) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  const bestDocument = scoredDocuments[0]?.document ?? documents[0];
  const result = answerFromDocument(bestDocument.extractedText, bestDocument.structured, question);

  return {
    documentId: bestDocument.id,
    answer: `Revisé ${documents.length} documentos. La mejor coincidencia fue "${bestDocument.fileName}".\n\n${result.answer}`,
    context: { ...result.context, documentCount: documents.length, selectedDocument: bestDocument.fileName },
  };
}

function requestedProductKeys(quoteLines: QuoteLine[], question: string) {
  const questionTokens = tokens(question);
  const normalizedQuestion = normalizeProductName(question);

  if (!questionTokens.length) {
    return [];
  }

  const scores = new Map<string, number>();

  for (const line of quoteLines) {
    const productText = normalizeProductName(line.product);
    let score = normalizedQuestion.includes(line.productKey) ? 5 : 0;

    for (const token of questionTokens) {
      if (productText.includes(token)) {
        score += 2;
      }
    }

    if (score > 0) {
      scores.set(line.productKey, Math.max(scores.get(line.productKey) ?? 0, score));
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => key);
}

function discoverAliasCandidates(quoteLines: QuoteLine[], existingAliases: ProductAlias[]) {
  const existing = new Set(existingAliases.map((alias) => `${normalizeProductName(alias.aliasName)}:${normalizeProductName(alias.canonicalName)}`));
  const products = Array.from(new Set(quoteLines.map((line) => normalizeProductName(line.product)).filter((product) => product.length >= 3))).slice(0, 120);
  const candidates: ProductAlias[] = [];

  for (let index = 0; index < products.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < products.length; otherIndex += 1) {
      const first = products[index];
      const second = products[otherIndex];

      if (!areLikelySameProduct(first, second)) {
        continue;
      }

      const canonicalName = first.length <= second.length ? first : second;
      const aliasName = first.length <= second.length ? second : first;
      const key = `${aliasName}:${canonicalName}`;

      if (aliasName !== canonicalName && !existing.has(key)) {
        existing.add(key);
        candidates.push({ canonicalName, aliasName, confidence: 74 });
      }
    }
  }

  return candidates.slice(0, 30);
}

async function saveProductAliases(organizationId: string, aliases: ProductAlias[]) {
  for (const alias of aliases) {
    await prisma.aiProductAlias.upsert({
      where: { organizationId_aliasName: { organizationId, aliasName: alias.aliasName } },
      update: { canonicalName: alias.canonicalName, confidence: alias.confidence },
      create: { organizationId, canonicalName: alias.canonicalName, aliasName: alias.aliasName, confidence: alias.confidence },
    });
  }
}

function areLikelySameProduct(first: string, second: string) {
  if (first === second) {
    return true;
  }

  const firstTokens = tokens(first);
  const secondTokens = tokens(second);
  const smaller = firstTokens.length <= secondTokens.length ? firstTokens : secondTokens;
  const larger = firstTokens.length <= secondTokens.length ? secondTokens : firstTokens;

  if (!smaller.length || !larger.length) {
    return false;
  }

  const sharedCount = smaller.filter((token) => larger.includes(token)).length;
  return sharedCount === smaller.length || (smaller.length >= 2 && sharedCount >= Math.ceil(smaller.length * 0.75));
}

function productKeyFor(product: string, aliases: ProductAlias[]) {
  const normalizedProduct = normalizeProductName(product);
  const alias = aliases.find((entry) => normalizeProductName(entry.aliasName) === normalizedProduct);
  return alias ? normalizeProductName(alias.canonicalName) : normalizedProduct;
}

function normalizeProductName(value: string) {
  return normalize(value)
    .replace(/\b(rojo|roja|azul|verde|blanco|blanca|negro|negra)\b/g, " $1 ")
    .replace(/[^a-z0-9ñ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findColumn(columns: string[], hints: string[]) {
  return columns.find((column) => hints.some((hint) => normalize(column).includes(hint))) ?? null;
}

function findPriceColumn(columns: string[], row: Record<string, unknown>) {
  const candidates = columns
    .map((column) => {
      const value = parseNumber(row[column]);
      const normalizedColumn = normalize(column);

      if (value === null) {
        return null;
      }

      let score = priceColumnHints.some((hint) => normalizedColumn.includes(hint)) ? 5 : 1;

      if (normalizedColumn.includes("unit")) {
        score += 2;
      }

      if (numericColumnRejects.some((word) => normalizedColumn.includes(word))) {
        score -= 5;
      }

      return { column, score };
    })
    .filter((candidate): candidate is { column: string; score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.score > 0 ? candidates[0].column : null;
}

function inferProductFromRow(row: Record<string, unknown>) {
  const textValues = Object.values(row)
    .map(cellText)
    .filter((value) => value.length >= 3 && parseNumber(value) === null);

  return textValues.sort((a, b) => b.length - a.length)[0] ?? "";
}

function cellText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function currencyFromText(value: string) {
  const normalizedValue = normalize(value);
  if (/\busd\b|us\$/.test(normalizedValue)) {
    return "USD";
  }

  return "DOP";
}

function companyFromText(text: string, fileName: string) {
  const match = text.match(/(?:empresa|suplidor|proveedor|vendor|compania|compañia)\s*:?\s*([^\n\r]{3,80})/i);
  return match?.[1]?.trim() || supplierFromFileName(fileName);
}

function supplierFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "Proveedor sin nombre";
}

function answerFromTables(structured: StructuredDocument | null, question: string, questionTokens: string[]) {
  if (!structured?.sheets?.length) {
    return null;
  }

  const normalizedQuestion = normalize(question);
  const wantsCount = /\b(cuantos|cuantas|cantidad|registros|filas)\b/.test(normalizedQuestion);
  const wantsAverage = /\b(promedio|media)\b/.test(normalizedQuestion);
  const wantsMax = /\b(mayor|maximo|máximo|mas alto|más alto)\b/.test(normalizedQuestion);
  const wantsMin = /\b(menor|minimo|mínimo|mas bajo|más bajo)\b/.test(normalizedQuestion);
  const wantsSum = /\b(total|suma|sumar|monto|importe|gasto|valor)\b/.test(normalizedQuestion);
  const lines: string[] = [];

  for (const sheet of structured.sheets.slice(0, 4)) {
    const matchedRows = filterRows(sheet.rows, questionTokens);
    const rows = matchedRows.length ? matchedRows : sheet.rows;
    const numericColumns = sheet.columns.filter((column) => rows.some((row) => parseNumber(row[column]) !== null));

    lines.push(`Hoja "${sheet.name}": ${sheet.rows.length} filas y ${sheet.columns.length} columnas.`);

    if (wantsCount) {
      lines.push(`- Filas que coinciden con tu pregunta: ${rows.length}.`);
    }

    if ((wantsSum || wantsAverage || wantsMax || wantsMin) && numericColumns.length) {
      const preferredColumns = preferredNumericColumns(numericColumns, question);
      const columnsToReport = preferredColumns.length ? preferredColumns : numericColumns.slice(0, 4);

      for (const column of columnsToReport) {
        const values = rows.map((row) => parseNumber(row[column])).filter((value): value is number => value !== null);
        if (!values.length) {
          continue;
        }

        const sum = values.reduce((total, value) => total + value, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const metrics = [
          wantsSum ? `total ${formatNumber(sum)}` : null,
          wantsAverage ? `promedio ${formatNumber(avg)}` : null,
          wantsMax ? `mayor ${formatNumber(max)}` : null,
          wantsMin ? `menor ${formatNumber(min)}` : null,
        ].filter(Boolean);

        lines.push(`- ${column}: ${metrics.join(", ")} (${values.length} valores).`);
      }
    }
  }

  return lines.join("\n");
}

function filterRows(rows: Record<string, unknown>[], questionTokens: string[]) {
  if (!questionTokens.length) {
    return [];
  }

  return rows.filter((row) => {
    const rowText = normalize(Object.values(row).join(" "));
    return questionTokens.some((token) => rowText.includes(token));
  });
}

function preferredNumericColumns(columns: string[], question: string) {
  const normalizedQuestion = normalize(question);
  const preferredWords = ["total", "monto", "importe", "precio", "costo", "valor", "cantidad", "qty", "subtotal"];
  const directMatches = columns.filter((column) => {
    const normalizedColumn = normalize(column);
    return normalizedQuestion.includes(normalizedColumn);
  });

  if (directMatches.length) {
    return directMatches;
  }

  return columns.filter((column) => {
    const normalizedColumn = normalize(column);
    return preferredWords.some((word) => normalizedColumn.includes(word));
  });
}

function findSnippets(text: string, questionTokens: string[]) {
  const chunks = text
    .split(/\n{1,2}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 12)
    .slice(0, 900);

  return chunks
    .map((chunk) => ({
      chunk,
      score: questionTokens.reduce((score, token) => score + (normalize(chunk).includes(token) ? 1 : 0), 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.length - b.chunk.length)
    .slice(0, 4)
    .map((entry) => (entry.chunk.length > 360 ? `${entry.chunk.slice(0, 360)}...` : entry.chunk));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(value);
}

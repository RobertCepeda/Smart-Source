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

const MAX_TEXT_LENGTH = 240_000;
const MAX_ROWS_PER_SHEET = 700;
const MAX_SHEETS = 12;
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

export async function createAiDocument(organizationId: string, uploadedById: string | null, file: Express.Multer.File) {
  const parsed = await parseUploadedDocument(file);
  const extension = extensionOf(file.originalname);

  const document = await prisma.aiDocument.create({
    data: {
      organizationId,
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

function mapDocument(document: any) {
  const structured = document.structuredJson as unknown as StructuredDocument | null;
  const sheets = structured?.sheets ?? [];

  return {
    id: document.id,
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

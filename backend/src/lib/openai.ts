import OpenAI, { toFile } from "openai";
import { env } from "../config/env";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type OpenAiAnswer = {
  answer: string;
  responseId: string | null;
  model: string;
};

type OpenAiImageText = {
  text: string;
  responseId: string | null;
  model: string;
};

const SYSTEM_INSTRUCTIONS = `
Eres el asistente de documentos de Smart Source. Responde siempre en espanol natural, amable y profesional.

Tu trabajo:
- Conversar como un asesor claro, no como un reporte frio.
- Usar los archivos del chat como fuente principal.
- Responder directamente lo que el usuario pregunto antes de mencionar detalles secundarios.
- Si el usuario pregunta de que trata un documento, explica el tema y los puntos importantes en lenguaje sencillo.
- Si hay varios documentos y el usuario no especifica cual, identifica el mas probable y dilo con calma.
- Si hay productos con nombres parecidos, pregunta una aclaracion breve y propone la equivalencia posible.
- Si el usuario confirma una equivalencia, explicale que la usaras para proximas comparaciones.
- Si no encuentras evidencia suficiente, dilo sin inventar y sugiere que dato falta.
- Cuando sea util, menciona el archivo origen y montos/fechas exactas.

Evita respuestas genericas como "Revise X documentos" si no aportan al usuario. Se concreto, cercano y facil de entender.
`.trim();

let client: OpenAI | null | undefined;

export function isOpenAiEnabled() {
  return Boolean(env.OPENAI_API_KEY);
}

export function openAiModel() {
  return env.OPENAI_MODEL;
}

function getClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (client === undefined) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return client;
}

export async function createVectorStore(name: string) {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const vectorStore = await openai.vectorStores.create({
    name: name.slice(0, 250),
  });

  return vectorStore.id;
}

export async function deleteVectorStore(vectorStoreId: string | null | undefined) {
  const openai = getClient();
  if (!openai || !vectorStoreId) {
    return;
  }

  await openai.vectorStores.delete(vectorStoreId);
}

export async function uploadFileToVectorStore(
  vectorStoreId: string,
  file: Express.Multer.File,
  attributes: Record<string, string | number | boolean>,
) {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const uploadable = await toFile(file.buffer, file.originalname, {
    type: file.mimetype || "application/octet-stream",
  });

  const uploaded = await openai.files.create({
    file: uploadable,
    purpose: "assistants",
  });

  const vectorFile = await openai.vectorStores.files.createAndPoll(
    vectorStoreId,
    {
      file_id: uploaded.id,
      attributes,
    },
    { pollIntervalMs: 1200 },
  );

  if (vectorFile.status === "failed") {
    const message = vectorFile.last_error?.message ?? "OpenAI no pudo procesar el archivo.";
    throw new Error(message);
  }

  return uploaded.id;
}

export async function uploadTextToVectorStore(
  vectorStoreId: string,
  fileName: string,
  text: string,
  attributes: Record<string, string | number | boolean>,
) {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const safeName = fileName.toLowerCase().endsWith(".txt") ? fileName : `${fileName}.txt`;
  const uploadable = await toFile(Buffer.from(text, "utf8"), safeName, {
    type: "text/plain",
  });

  const uploaded = await openai.files.create({
    file: uploadable,
    purpose: "assistants",
  });

  const vectorFile = await openai.vectorStores.files.createAndPoll(
    vectorStoreId,
    {
      file_id: uploaded.id,
      attributes: { ...attributes, syncedAsText: true },
    },
    { pollIntervalMs: 1200 },
  );

  if (vectorFile.status === "failed") {
    const message = vectorFile.last_error?.message ?? "OpenAI no pudo procesar el texto del archivo.";
    throw new Error(message);
  }

  return uploaded.id;
}

export async function deleteOpenAiFile(fileId: string | null | undefined) {
  const openai = getClient();
  if (!openai || !fileId) {
    return;
  }

  await openai.files.delete(fileId);
}

export async function deleteVectorStoreFile(vectorStoreId: string | null | undefined, fileId: string | null | undefined) {
  const openai = getClient();
  if (!openai || !vectorStoreId || !fileId) {
    return;
  }

  await openai.vectorStores.files.delete(fileId, { vector_store_id: vectorStoreId });

  try {
    await openai.files.delete(fileId);
  } catch {
    // The file may already be removed after detaching it from the vector store.
  }
}

export async function answerWithOpenAi(
  vectorStoreId: string,
  question: string,
  history: ChatTurn[],
  documentHints: Array<{ fileName: string; summary: string }>,
): Promise<OpenAiAnswer | null> {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const hints = documentHints
    .slice(0, 12)
    .map((document, index) => `${index + 1}. ${document.fileName}: ${document.summary}`)
    .join("\n");

  const input = [
    {
      role: "user",
      content: `Archivos disponibles en este chat:\n${hints || "No hay resumen local disponible."}`,
    },
    ...history.slice(-16),
    {
      role: "user",
      content: question,
    },
  ];

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    instructions: SYSTEM_INSTRUCTIONS,
    input,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [vectorStoreId],
      },
    ],
  } as any);

  return {
    answer: extractOutputText(response),
    responseId: response.id ?? null,
    model: env.OPENAI_MODEL,
  };
}

export async function extractTextFromImageWithOpenAi(file: Express.Multer.File): Promise<OpenAiImageText | null> {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const mimeType = file.mimetype || "image/png";
  const dataUrl = `data:${mimeType};base64,${file.buffer.toString("base64")}`;
  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    instructions: [
      "Eres el lector OCR de Smart Source.",
      "Extrae todo el texto visible de la imagen con fidelidad.",
      "Si parece una cotizacion, factura o solicitud, conserva tablas, cantidades, unidades, precios, marcas, modelos, impuestos, fechas y tiempos de entrega.",
      "No inventes datos. Si algo no se entiende, escribe [ilegible].",
    ].join(" "),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Lee esta imagen y devuelve el texto estructurado de forma clara para poder analizarlo como cotizacion o documento de compra.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high",
          },
        ],
      },
    ],
  } as any);

  return {
    text: extractOutputText(response),
    responseId: response.id ?? null,
    model: env.OPENAI_MODEL,
  };
}

function extractOutputText(response: unknown) {
  const outputText = (response as { output_text?: string }).output_text;
  if (outputText?.trim()) {
    return outputText.trim();
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output ?? [];
  const text = output
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "No pude generar una respuesta con los documentos cargados. Prueba de nuevo con una pregunta mas especifica.";
}

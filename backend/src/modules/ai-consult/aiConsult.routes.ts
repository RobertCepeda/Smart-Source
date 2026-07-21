import { Router } from "express";
import multer from "multer";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middlewares/validate";
import { aiChatParamsSchema, aiDocumentParamsSchema, askAiDocumentSchema, createAiChatSchema } from "./aiConsult.schema";
import {
  askAiChat,
  askAiDocument,
  askAiWorkspace,
  createAiChat,
  createAiDocument,
  getAiChat,
  getAiDocument,
  listAiChats,
  listAiDocuments,
  uploadAiChatDocument,
} from "./aiConsult.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

export const aiConsultRouter = Router();

aiConsultRouter.use(authenticate);

aiConsultRouter.get("/documents", async (req, res, next) => {
  try {
    res.json({ documents: await listAiDocuments(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.post("/documents", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Selecciona un archivo para analizar." });
      return;
    }

    const document = await createAiDocument(organizationId(req), req.user?.id ?? null, req.file);
    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.get("/chats", async (req, res, next) => {
  try {
    res.json({ chats: await listAiChats(organizationId(req)) });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.post("/chats", validate({ body: createAiChatSchema }), async (req, res, next) => {
  try {
    const { title } = createAiChatSchema.parse(req.body);
    const chat = await createAiChat(organizationId(req), req.user?.id ?? null, title ?? "Cotizaciones de hoy");
    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.get("/chats/:id", validate({ params: aiChatParamsSchema }), async (req, res, next) => {
  try {
    const { id } = aiChatParamsSchema.parse(req.params);
    res.json({ chat: await getAiChat(organizationId(req), id) });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.post(
  "/chats/:id/documents",
  validate({ params: aiChatParamsSchema }),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "Selecciona un archivo para analizar." });
        return;
      }

      const { id } = aiChatParamsSchema.parse(req.params);
      const document = await uploadAiChatDocument(organizationId(req), id, req.user?.id ?? null, req.file);
      res.status(201).json({ document });
    } catch (error) {
      next(error);
    }
  },
);

aiConsultRouter.post(
  "/chats/:id/questions",
  validate({ params: aiChatParamsSchema, body: askAiDocumentSchema }),
  async (req, res, next) => {
    try {
      const { id } = aiChatParamsSchema.parse(req.params);
      const { question } = askAiDocumentSchema.parse(req.body);
      const answer = await askAiChat(organizationId(req), id, req.user?.id ?? null, question);
      res.status(201).json({ answer });
    } catch (error) {
      next(error);
    }
  },
);

aiConsultRouter.get("/documents/:id", validate({ params: aiDocumentParamsSchema }), async (req, res, next) => {
  try {
    const { id } = aiDocumentParamsSchema.parse(req.params);
    res.json({ document: await getAiDocument(organizationId(req), id) });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.post("/questions", validate({ body: askAiDocumentSchema }), async (req, res, next) => {
  try {
    const { question } = askAiDocumentSchema.parse(req.body);
    const answer = await askAiWorkspace(organizationId(req), req.user?.id ?? null, question);
    res.status(201).json({ answer });
  } catch (error) {
    next(error);
  }
});

aiConsultRouter.post(
  "/documents/:id/questions",
  validate({ params: aiDocumentParamsSchema, body: askAiDocumentSchema }),
  async (req, res, next) => {
    try {
      const { id } = aiDocumentParamsSchema.parse(req.params);
      const { question } = askAiDocumentSchema.parse(req.body);
      const answer = await askAiDocument(organizationId(req), id, req.user?.id ?? null, question);
      res.status(201).json({ answer });
    } catch (error) {
      next(error);
    }
  },
);

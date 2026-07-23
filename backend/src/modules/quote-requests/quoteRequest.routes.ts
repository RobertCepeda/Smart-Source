import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../auth/auth.middleware";
import {
  createQuoteRequestSchema,
  createSupplierQuoteSchema,
  listQuoteRequestsQuerySchema,
  quoteRequestIdParamsSchema,
  quoteRequestSupplierParamsSchema,
} from "./quoteRequest.schema";
import {
  createQuoteRequest,
  generateSupplierEmail,
  getQuoteRequest,
  listQuoteRequests,
  registerSupplierQuote,
} from "./quoteRequest.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 8 },
});

export const quoteRequestRouter = Router();

quoteRequestRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

function parseCreatePayload(req: Request) {
  let raw: unknown = req.body;

  if (typeof req.body.data === "string") {
    try {
      raw = JSON.parse(req.body.data);
    } catch {
      return {
        success: false as const,
        response: {
          message: "No pudimos leer los datos de la solicitud. Revisa el formulario e intenta de nuevo.",
        },
      };
    }
  }

  const parsed = createQuoteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      response: {
        message: "Revisa los campos marcados e intenta de nuevo.",
        errors: parsed.error.flatten(),
      },
    };
  }

  return { success: true as const, data: parsed.data };
}

quoteRequestRouter.get("/", validate({ query: listQuoteRequestsQuerySchema }), async (req, res, next) => {
  try {
    const requests = await listQuoteRequests(organizationId(req), listQuoteRequestsQuerySchema.parse(req.query));
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

quoteRequestRouter.post("/", upload.array("attachments", 8), async (req, res, next) => {
  try {
    const parsed = parseCreatePayload(req);
    if (!parsed.success) {
      res.status(400).json(parsed.response);
      return;
    }

    const request = await createQuoteRequest(
      organizationId(req),
      req.user?.id ?? null,
      parsed.data,
      (req.files as Express.Multer.File[]) ?? [],
    );
    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
});

quoteRequestRouter.get("/:id", validate({ params: quoteRequestIdParamsSchema }), async (req, res, next) => {
  try {
    const { id } = quoteRequestIdParamsSchema.parse(req.params);
    const request = await getQuoteRequest(organizationId(req), id);
    res.json({ request });
  } catch (error) {
    next(error);
  }
});

quoteRequestRouter.post(
  "/:id/suppliers/:supplierId/email",
  validate({ params: quoteRequestSupplierParamsSchema }),
  async (req, res, next) => {
    try {
      const { id, supplierId } = quoteRequestSupplierParamsSchema.parse(req.params);
      const email = await generateSupplierEmail(organizationId(req), id, supplierId);
      res.status(201).json(email);
    } catch (error) {
      next(error);
    }
  },
);

quoteRequestRouter.post(
  "/:id/quotes",
  validate({ params: quoteRequestIdParamsSchema }),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "Selecciona el archivo de cotización recibido." });
        return;
      }

      const { id } = quoteRequestIdParamsSchema.parse(req.params);
      const parsed = createSupplierQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: "Revisa los campos marcados e intenta de nuevo.",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const quote = await registerSupplierQuote(organizationId(req), id, parsed.data, req.file);
      res.status(201).json({ quote });
    } catch (error) {
      next(error);
    }
  },
);

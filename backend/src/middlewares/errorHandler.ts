import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: "No encontramos esa ruta. Verifica la dirección e intenta de nuevo.",
    path: req.originalUrl,
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = typeof error.status === "number" ? error.status : 500;
  const isInternalError = status >= 500;

  if (isInternalError) {
    console.error(error);
  }

  res.status(status).json({
    message: isInternalError
      ? "Tuvimos un problema procesando la solicitud. Intenta de nuevo en un momento."
      : error.message ?? "No pudimos completar la solicitud.",
  });
};

import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export function validate(schemas: RequestSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[location as keyof Request]);

      if (!result.success) {
        return res.status(400).json({
          message: "Revisa los campos marcados e intenta de nuevo.",
          errors: result.error.flatten(),
        });
      }
    }

    return next();
  };
}

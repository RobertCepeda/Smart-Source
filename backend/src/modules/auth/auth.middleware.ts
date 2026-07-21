import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { findUserById } from "./auth.service";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string | null;
        organization?: {
          id: string;
          name: string;
          slug: string;
          accountType: string;
          plan: string;
        } | null;
        name: string;
        email: string;
        company: string | null;
        avatarUrl: string | null;
        authProvider: string;
        role: string;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Sesión requerida." });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = typeof payload === "string" ? null : payload.sub;

    if (!userId) {
      return res.status(401).json({ message: "Sesión inválida." });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(401).json({ message: "Sesión inválida." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Sesión expirada o inválida." });
  }
}

export function requireSystemAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "SYSTEM_ADMIN") {
    return res.status(403).json({
      message: "No tienes acceso a este portal.",
    });
  }

  return next();
}

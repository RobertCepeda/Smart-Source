import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authenticate } from "./auth.middleware";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.schema";
import { login, register, updateProfile } from "./auth.service";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const result = await register(registerSchema.parse(req.body));
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const result = await login(loginSchema.parse(req.body));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

authRouter.put("/profile", authenticate, validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const user = await updateProfile(req.user!.id, updateProfileSchema.parse(req.body));
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/google", (_req, res) => {
  res.status(501).json({
    message: "Google login esta preparado en la interfaz. Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
  });
});

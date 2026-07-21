import { Router } from "express";
import { authenticate, requireSystemAdmin } from "../auth/auth.middleware";
import { getAdminOverview, listOrganizationsForAdmin, listSupportTicketsForAdmin } from "./admin.service";

export const adminRouter = Router();

adminRouter.use(authenticate, requireSystemAdmin);

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    res.json({ overview: await getAdminOverview() });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/organizations", async (_req, res, next) => {
  try {
    res.json({ organizations: await listOrganizationsForAdmin() });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/support-tickets", async (_req, res, next) => {
  try {
    res.json({ tickets: await listSupportTicketsForAdmin() });
  } catch (error) {
    next(error);
  }
});

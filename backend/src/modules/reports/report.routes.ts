import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getReportsSummary } from "./report.service";

export const reportRouter = Router();

reportRouter.use(authenticate);

function organizationId(req: Express.Request) {
  if (!req.user?.organizationId) {
    const error = new Error("Tu usuario no tiene organización asignada.");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  return req.user.organizationId;
}

reportRouter.get("/summary", async (req, res, next) => {
  try {
    res.json(await getReportsSummary(organizationId(req)));
  } catch (error) {
    next(error);
  }
});

reportRouter.get("/spending", async (req, res, next) => {
  try {
    const report = await getReportsSummary(organizationId(req));
    res.json({
      spendingBySupplier: report.spendingBySupplier,
      spendingByCategory: report.spendingByCategory,
      spendingByMonth: report.spendingByMonth,
      spendingByStatus: report.spendingByStatus,
    });
  } catch (error) {
    next(error);
  }
});

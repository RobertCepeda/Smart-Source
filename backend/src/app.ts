import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { aiConsultRouter } from "./modules/ai-consult/aiConsult.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { brandRouter, categoryRouter, itemRouter, tagRouter } from "./modules/catalog/catalog.routes";
import { contactRouter } from "./modules/contacts/contact.routes";
import { organizationRouter } from "./modules/organizations/organization.routes";
import { priceHistoryRouter } from "./modules/price-history/priceHistory.routes";
import { purchaseOrderRouter } from "./modules/purchase-orders/purchaseOrder.routes";
import { reportRouter } from "./modules/reports/report.routes";
import { searchRouter } from "./modules/search/search.routes";
import { supplierRouter } from "./modules/suppliers/supplier.routes";
import { supportRouter } from "./modules/support/support.routes";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    app: "Smart Source",
    status: "ok",
    module: "foundation",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/items", itemRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/brands", brandRouter);
app.use("/api/tags", tagRouter);
app.use("/api/search", searchRouter);
app.use("/api/purchase-orders", purchaseOrderRouter);
app.use("/api/price-history", priceHistoryRouter);
app.use("/api/reports", reportRouter);
app.use("/api/support", supportRouter);
app.use("/api/ai-consult", aiConsultRouter);

app.use(notFoundHandler);
app.use(errorHandler);

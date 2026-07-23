CREATE TYPE "QuoteEmailStatus" AS ENUM ('GENERADO', 'ENVIADO', 'FALLIDO');
CREATE TYPE "SupplierQuoteStatus" AS ENUM ('RECIBIDA', 'ANALIZADA', 'EN_REVISION', 'APROBADA', 'DESCARTADA');

CREATE TABLE "QuoteRequestSupplier" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestSupplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequestEmailLog" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "supplierId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "QuoteEmailStatus" NOT NULL DEFAULT 'GENERADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierQuote" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "observations" TEXT,
    "reviewStatus" "SupplierQuoteStatus" NOT NULL DEFAULT 'ANALIZADA',
    "extractedText" TEXT NOT NULL,
    "analysisJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierQuoteLine" (
    "id" TEXT NOT NULL,
    "supplierQuoteId" TEXT NOT NULL,
    "quoteRequestItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2),
    "unit" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "unitPrice" DECIMAL(12,2),
    "totalPrice" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "leadTime" TEXT,
    "warranty" TEXT,
    "availability" TEXT,
    "observations" TEXT,
    "matchScore" INTEGER,
    "differences" TEXT,
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteRequestSupplier_quoteRequestId_supplierId_key" ON "QuoteRequestSupplier"("quoteRequestId", "supplierId");
CREATE INDEX "QuoteRequestSupplier_quoteRequestId_idx" ON "QuoteRequestSupplier"("quoteRequestId");
CREATE INDEX "QuoteRequestSupplier_supplierId_idx" ON "QuoteRequestSupplier"("supplierId");
CREATE INDEX "QuoteRequestEmailLog_quoteRequestId_idx" ON "QuoteRequestEmailLog"("quoteRequestId");
CREATE INDEX "QuoteRequestEmailLog_supplierId_idx" ON "QuoteRequestEmailLog"("supplierId");
CREATE INDEX "QuoteRequestEmailLog_createdAt_idx" ON "QuoteRequestEmailLog"("createdAt");
CREATE INDEX "SupplierQuote_quoteRequestId_idx" ON "SupplierQuote"("quoteRequestId");
CREATE INDEX "SupplierQuote_supplierId_idx" ON "SupplierQuote"("supplierId");
CREATE INDEX "SupplierQuote_receivedAt_idx" ON "SupplierQuote"("receivedAt");
CREATE INDEX "SupplierQuote_reviewStatus_idx" ON "SupplierQuote"("reviewStatus");
CREATE INDEX "SupplierQuoteLine_supplierQuoteId_idx" ON "SupplierQuoteLine"("supplierQuoteId");
CREATE INDEX "SupplierQuoteLine_quoteRequestItemId_idx" ON "SupplierQuoteLine"("quoteRequestItemId");

ALTER TABLE "QuoteRequestSupplier" ADD CONSTRAINT "QuoteRequestSupplier_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequestSupplier" ADD CONSTRAINT "QuoteRequestSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequestEmailLog" ADD CONSTRAINT "QuoteRequestEmailLog_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequestEmailLog" ADD CONSTRAINT "QuoteRequestEmailLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_supplierQuoteId_fkey" FOREIGN KEY ("supplierQuoteId") REFERENCES "SupplierQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_quoteRequestItemId_fkey" FOREIGN KEY ("quoteRequestItemId") REFERENCES "QuoteRequestItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "QuoteRequestStatus" AS ENUM ('BORRADOR', 'LISTA_PARA_ENVIAR', 'ENVIADA', 'RECIBIENDO_COTIZACIONES', 'CERRADA', 'CANCELADA');

CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT,
    "number" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'BORRADOR',
    "project" TEXT NOT NULL,
    "costCenter" TEXT,
    "requesterName" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequestItem" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "technicalSpecs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequestAttachment" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteRequest_number_key" ON "QuoteRequest"("number");
CREATE INDEX "QuoteRequest_organizationId_idx" ON "QuoteRequest"("organizationId");
CREATE INDEX "QuoteRequest_requesterId_idx" ON "QuoteRequest"("requesterId");
CREATE INDEX "QuoteRequest_number_idx" ON "QuoteRequest"("number");
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");
CREATE INDEX "QuoteRequest_deadline_idx" ON "QuoteRequest"("deadline");
CREATE INDEX "QuoteRequest_createdAt_idx" ON "QuoteRequest"("createdAt");
CREATE INDEX "QuoteRequestItem_quoteRequestId_idx" ON "QuoteRequestItem"("quoteRequestId");
CREATE INDEX "QuoteRequestAttachment_quoteRequestId_idx" ON "QuoteRequestAttachment"("quoteRequestId");

ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteRequestItem" ADD CONSTRAINT "QuoteRequestItem_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequestAttachment" ADD CONSTRAINT "QuoteRequestAttachment_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

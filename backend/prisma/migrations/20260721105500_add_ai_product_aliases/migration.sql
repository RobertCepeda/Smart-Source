CREATE TABLE "AiProductAlias" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliasName" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProductAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiProductAlias_organizationId_aliasName_key" ON "AiProductAlias"("organizationId", "aliasName");
CREATE INDEX "AiProductAlias_organizationId_idx" ON "AiProductAlias"("organizationId");
CREATE INDEX "AiProductAlias_canonicalName_idx" ON "AiProductAlias"("canonicalName");

ALTER TABLE "AiProductAlias" ADD CONSTRAINT "AiProductAlias_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UnitOfMeasure" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "abbreviation" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequestDraft" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuoteRequestDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UnitOfMeasure_organizationId_name_key" ON "UnitOfMeasure"("organizationId", "name");
CREATE INDEX "UnitOfMeasure_organizationId_idx" ON "UnitOfMeasure"("organizationId");
CREATE INDEX "UnitOfMeasure_name_idx" ON "UnitOfMeasure"("name");

CREATE UNIQUE INDEX "QuoteRequestDraft_organizationId_userId_key" ON "QuoteRequestDraft"("organizationId", "userId");
CREATE INDEX "QuoteRequestDraft_organizationId_idx" ON "QuoteRequestDraft"("organizationId");
CREATE INDEX "QuoteRequestDraft_userId_idx" ON "QuoteRequestDraft"("userId");
CREATE INDEX "QuoteRequestDraft_updatedAt_idx" ON "QuoteRequestDraft"("updatedAt");

ALTER TABLE "UnitOfMeasure"
  ADD CONSTRAINT "UnitOfMeasure_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteRequestDraft"
  ADD CONSTRAINT "QuoteRequestDraft_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteRequestDraft"
  ADD CONSTRAINT "QuoteRequestDraft_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH default_units(name, abbreviation) AS (
  VALUES
    ('unidad', 'und'),
    ('metro', 'm'),
    ('centímetro', 'cm'),
    ('milímetro', 'mm'),
    ('pie', 'ft'),
    ('pulgada', 'in'),
    ('yarda', 'yd'),
    ('metro cuadrado', 'm2'),
    ('pie cuadrado', 'ft2'),
    ('metro cúbico', 'm3'),
    ('pie cúbico', 'ft3'),
    ('kilogramo', 'kg'),
    ('gramo', 'g'),
    ('libra', 'lb'),
    ('tonelada', 'ton'),
    ('litro', 'l'),
    ('galón', 'gal'),
    ('funda', NULL),
    ('saco', NULL),
    ('caja', NULL),
    ('paquete', NULL),
    ('rollo', NULL),
    ('tubo', NULL),
    ('varilla', NULL),
    ('plancha', NULL),
    ('hoja', NULL),
    ('par', NULL),
    ('juego', NULL),
    ('lote', NULL),
    ('servicio', NULL),
    ('hora', 'h'),
    ('día', NULL),
    ('semana', NULL),
    ('mes', NULL),
    ('viaje', NULL)
)
INSERT INTO "UnitOfMeasure" ("id", "organizationId", "name", "abbreviation", "isActive", "createdAt", "updatedAt")
SELECT
  'unit_' || substr(md5("Organization"."id" || ':' || default_units.name), 1, 24),
  "Organization"."id",
  default_units.name,
  default_units.abbreviation,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Organization"
CROSS JOIN default_units
ON CONFLICT ("organizationId", "name") DO NOTHING;

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'BUYER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'WAREHOUSE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';

ALTER TYPE "SupportTicketStatus" ADD VALUE IF NOT EXISTS 'EN_ESPERA';

ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);

CREATE TYPE "WarehouseType" AS ENUM ('GENERAL', 'PROJECT');
CREATE TYPE "InventoryMovementType" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

ALTER TABLE "Supplier" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Item" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "Subcategory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subcategory_organizationId_categoryId_name_key"
  ON "Subcategory"("organizationId", "categoryId", "name");
CREATE INDEX "Subcategory_organizationId_idx" ON "Subcategory"("organizationId");
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

ALTER TABLE "Subcategory"
  ADD CONSTRAINT "Subcategory_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subcategory"
  ADD CONSTRAINT "Subcategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Item" ADD COLUMN "subcategoryId" TEXT;
CREATE INDEX "Item_subcategoryId_idx" ON "Item"("subcategoryId");
ALTER TABLE "Item"
  ADD CONSTRAINT "Item_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Warehouse" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "WarehouseType" NOT NULL DEFAULT 'GENERAL',
  "project" TEXT,
  "location" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Warehouse_organizationId_code_key" ON "Warehouse"("organizationId", "code");
CREATE INDEX "Warehouse_organizationId_idx" ON "Warehouse"("organizationId");
CREATE INDEX "Warehouse_name_idx" ON "Warehouse"("name");
ALTER TABLE "Warehouse"
  ADD CONSTRAINT "Warehouse_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrder" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "quoteRequestId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "receivedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "receivedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN "costCenter" TEXT;

UPDATE "PurchaseOrder" AS po
SET "organizationId" = supplier."organizationId"
FROM "Supplier" AS supplier
WHERE supplier."id" = po."supplierId";

ALTER TABLE "PurchaseOrder" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");
CREATE INDEX "PurchaseOrder_quoteRequestId_idx" ON "PurchaseOrder"("quoteRequestId");
CREATE INDEX "PurchaseOrder_warehouseId_idx" ON "PurchaseOrder"("warehouseId");

ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_quoteRequestId_fkey"
  FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_receivedById_fkey"
  FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "InventoryBalance" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryBalance_warehouseId_itemId_key" ON "InventoryBalance"("warehouseId", "itemId");
CREATE INDEX "InventoryBalance_warehouseId_idx" ON "InventoryBalance"("warehouseId");
CREATE INDEX "InventoryBalance_itemId_idx" ON "InventoryBalance"("itemId");
ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "orderId" TEXT,
  "createdById" TEXT,
  "type" "InventoryMovementType" NOT NULL,
  "quantity" DECIMAL(14,2) NOT NULL,
  "unit" TEXT,
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryMovement_organizationId_idx" ON "InventoryMovement"("organizationId");
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "actorName" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

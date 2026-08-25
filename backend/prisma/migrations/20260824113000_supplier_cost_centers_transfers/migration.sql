ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_SALIDA';
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_ENTRADA';

ALTER TABLE "Supplier" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "subcategoryId" TEXT;
CREATE INDEX "Supplier_categoryId_idx" ON "Supplier"("categoryId");
CREATE INDEX "Supplier_subcategoryId_idx" ON "Supplier"("subcategoryId");
ALTER TABLE "Supplier"
  ADD CONSTRAINT "Supplier_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Supplier"
  ADD CONSTRAINT "Supplier_subcategoryId_fkey"
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CostCenter" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CostCenter_organizationId_code_key" ON "CostCenter"("organizationId", "code");
CREATE INDEX "CostCenter_organizationId_idx" ON "CostCenter"("organizationId");
CREATE INDEX "CostCenter_name_idx" ON "CostCenter"("name");
ALTER TABLE "CostCenter"
  ADD CONSTRAINT "CostCenter_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteRequest" ADD COLUMN "costCenterId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "costCenterId" TEXT;
CREATE INDEX "QuoteRequest_costCenterId_idx" ON "QuoteRequest"("costCenterId");
CREATE INDEX "PurchaseOrder_costCenterId_idx" ON "PurchaseOrder"("costCenterId");
ALTER TABLE "QuoteRequest"
  ADD CONSTRAINT "QuoteRequest_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "InventoryTransfer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "originWarehouseId" TEXT NOT NULL,
  "destinationWarehouseId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "createdById" TEXT,
  "quantity" DECIMAL(14,2) NOT NULL,
  "unit" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InventoryTransfer_organizationId_idx" ON "InventoryTransfer"("organizationId");
CREATE INDEX "InventoryTransfer_originWarehouseId_idx" ON "InventoryTransfer"("originWarehouseId");
CREATE INDEX "InventoryTransfer_destinationWarehouseId_idx" ON "InventoryTransfer"("destinationWarehouseId");
CREATE INDEX "InventoryTransfer_itemId_idx" ON "InventoryTransfer"("itemId");
CREATE INDEX "InventoryTransfer_createdAt_idx" ON "InventoryTransfer"("createdAt");
ALTER TABLE "InventoryTransfer"
  ADD CONSTRAINT "InventoryTransfer_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer"
  ADD CONSTRAINT "InventoryTransfer_originWarehouseId_fkey"
  FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer"
  ADD CONSTRAINT "InventoryTransfer_destinationWarehouseId_fkey"
  FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer"
  ADD CONSTRAINT "InventoryTransfer_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer"
  ADD CONSTRAINT "InventoryTransfer_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD COLUMN "transferId" TEXT;
CREATE INDEX "InventoryMovement_transferId_idx" ON "InventoryMovement"("transferId");
ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_transferId_fkey"
  FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Warehouse" DROP COLUMN "project";

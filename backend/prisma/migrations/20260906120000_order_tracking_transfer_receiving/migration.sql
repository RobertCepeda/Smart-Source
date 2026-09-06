-- Track purchase-order status changes and confirm inventory transfers at destination.
ALTER TABLE "PurchaseOrder" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "PurchaseOrderEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdById" TEXT,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderEvent_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "InventoryTransferStatus" AS ENUM ('PENDIENTE', 'RECIBIDA');

ALTER TABLE "InventoryTransfer"
  ADD COLUMN "driverId" TEXT,
  ADD COLUMN "receivedById" TEXT,
  ADD COLUMN "status" "InventoryTransferStatus" NOT NULL DEFAULT 'PENDIENTE',
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing transfers already affected both warehouses, so they are historical receipts.
UPDATE "InventoryTransfer" SET "status" = 'RECIBIDA', "receivedAt" = "createdAt";

CREATE INDEX "PurchaseOrderEvent_organizationId_idx" ON "PurchaseOrderEvent"("organizationId");
CREATE INDEX "PurchaseOrderEvent_orderId_idx" ON "PurchaseOrderEvent"("orderId");
CREATE INDEX "PurchaseOrderEvent_createdAt_idx" ON "PurchaseOrderEvent"("createdAt");
CREATE INDEX "InventoryTransfer_driverId_idx" ON "InventoryTransfer"("driverId");
CREATE INDEX "InventoryTransfer_receivedById_idx" ON "InventoryTransfer"("receivedById");
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

ALTER TABLE "PurchaseOrderEvent" ADD CONSTRAINT "PurchaseOrderEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderEvent" ADD CONSTRAINT "PurchaseOrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderEvent" ADD CONSTRAINT "PurchaseOrderEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed an initial event for orders created before this migration.
INSERT INTO "PurchaseOrderEvent" ("id", "organizationId", "orderId", "status", "note", "createdAt")
SELECT 'evt_' || md5("id"), "organizationId", "id", "status", 'ESTADO IMPORTADO DEL HISTORIAL', "issueDate"
FROM "PurchaseOrder";

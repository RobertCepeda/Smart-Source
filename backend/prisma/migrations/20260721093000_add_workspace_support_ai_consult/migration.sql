-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('SOPORTE', 'MANTENIMIENTO', 'FACTURACION', 'IDEA');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('BAJA', 'NORMAL', 'ALTA');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('ABIERTO', 'EN_REVISION', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "SupportAuthorType" AS ENUM ('CLIENTE', 'ADMIN', 'AUTOMATICO');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSTEM_ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'PERSONAL';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Item" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Drop old global uniqueness for tenant-scoped catalog records.
DROP INDEX IF EXISTS "Category_name_key";
DROP INDEX IF EXISTS "Brand_name_key";

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT,
    "subject" TEXT NOT NULL,
    "category" "SupportCategory" NOT NULL DEFAULT 'SOPORTE',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorType" "SupportAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "extension" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "extractedText" TEXT NOT NULL,
    "structuredJson" JSONB,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQuestion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "askedById" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "Category"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_organizationId_name_key" ON "Brand"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Brand_organizationId_idx" ON "Brand"("organizationId");

-- CreateIndex
CREATE INDEX "Item_organizationId_idx" ON "Item"("organizationId");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_idx" ON "SupportTicket"("organizationId");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterId_idx" ON "SupportTicket"("requesterId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_idx" ON "SupportMessage"("ticketId");

-- CreateIndex
CREATE INDEX "SupportMessage_authorId_idx" ON "SupportMessage"("authorId");

-- CreateIndex
CREATE INDEX "AiDocument_organizationId_idx" ON "AiDocument"("organizationId");

-- CreateIndex
CREATE INDEX "AiDocument_uploadedById_idx" ON "AiDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "AiDocument_createdAt_idx" ON "AiDocument"("createdAt");

-- CreateIndex
CREATE INDEX "AiQuestion_documentId_idx" ON "AiQuestion"("documentId");

-- CreateIndex
CREATE INDEX "AiQuestion_askedById_idx" ON "AiQuestion"("askedById");

-- CreateIndex
CREATE INDEX "AiQuestion_createdAt_idx" ON "AiQuestion"("createdAt");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDocument" ADD CONSTRAINT "AiDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDocument" ADD CONSTRAINT "AiDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestion" ADD CONSTRAINT "AiQuestion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AiDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestion" ADD CONSTRAINT "AiQuestion_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

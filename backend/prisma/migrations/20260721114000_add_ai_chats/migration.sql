CREATE TABLE "AiChat" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChat_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiDocument" ADD COLUMN "chatId" TEXT;
ALTER TABLE "AiQuestion" ADD COLUMN "chatId" TEXT;

CREATE INDEX "AiChat_organizationId_idx" ON "AiChat"("organizationId");
CREATE INDEX "AiChat_createdById_idx" ON "AiChat"("createdById");
CREATE INDEX "AiChat_updatedAt_idx" ON "AiChat"("updatedAt");
CREATE INDEX "AiDocument_chatId_idx" ON "AiDocument"("chatId");
CREATE INDEX "AiQuestion_chatId_idx" ON "AiQuestion"("chatId");

ALTER TABLE "AiChat" ADD CONSTRAINT "AiChat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiChat" ADD CONSTRAINT "AiChat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiDocument" ADD CONSTRAINT "AiDocument_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AiChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiQuestion" ADD CONSTRAINT "AiQuestion_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AiChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

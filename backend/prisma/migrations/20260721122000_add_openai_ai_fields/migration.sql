ALTER TABLE "AiChat" ADD COLUMN "openaiVectorStoreId" TEXT;
ALTER TABLE "AiDocument" ADD COLUMN "openaiFileId" TEXT;

CREATE INDEX "AiChat_openaiVectorStoreId_idx" ON "AiChat"("openaiVectorStoreId");
CREATE INDEX "AiDocument_openaiFileId_idx" ON "AiDocument"("openaiFileId");

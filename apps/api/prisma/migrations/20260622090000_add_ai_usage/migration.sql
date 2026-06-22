-- AI daily quota accounting. keyHash stores a one-way hash of user/ip/session
-- material; raw IP/session values are intentionally not persisted.
CREATE TYPE "AiUsageKeyType" AS ENUM ('user', 'ip_session', 'ip');

CREATE TABLE "AiUsage" (
  "id" TEXT NOT NULL,
  "keyType" "AiUsageKeyType" NOT NULL,
  "keyHash" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "aiRequests" INTEGER NOT NULL DEFAULT 0,
  "imageUploads" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiUsage_keyType_keyHash_date_key" ON "AiUsage"("keyType", "keyHash", "date");
CREATE INDEX "AiUsage_date_idx" ON "AiUsage"("date");
CREATE INDEX "AiUsage_keyType_keyHash_idx" ON "AiUsage"("keyType", "keyHash");

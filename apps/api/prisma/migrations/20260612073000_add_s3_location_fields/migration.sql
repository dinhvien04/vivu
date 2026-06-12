ALTER TABLE "Place"
  ADD COLUMN IF NOT EXISTS "locationKey" TEXT,
  ADD COLUMN IF NOT EXISTS "province" TEXT NOT NULL DEFAULT 'Gia Lai',
  ADD COLUMN IF NOT EXISTS "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "heroImageS3Key" TEXT,
  ADD COLUMN IF NOT EXISTS "qdrantPlaceSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "isAiReady" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Photo"
  ADD COLUMN IF NOT EXISTS "s3Key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Place_locationKey_key" ON "Place"("locationKey");
CREATE INDEX IF NOT EXISTS "Place_locationKey_idx" ON "Place"("locationKey");
CREATE INDEX IF NOT EXISTS "Place_province_status_idx" ON "Place"("province", "status");
CREATE INDEX IF NOT EXISTS "Place_isAiReady_idx" ON "Place"("isAiReady");
CREATE UNIQUE INDEX IF NOT EXISTS "Photo_placeId_s3Key_key" ON "Photo"("placeId", "s3Key");

UPDATE "Place"
SET "province" = 'Vietnam'
WHERE "locationKey" IS NULL;

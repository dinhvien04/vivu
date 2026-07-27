-- Denormalized place ratings for efficient filtering/sorting.
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Place_status_ratingAvg_idx" ON "Place"("status", "ratingAvg");

UPDATE "Place" p
SET
  "ratingCount" = sub.cnt,
  "ratingAvg" = sub.avg
FROM (
  SELECT
    "placeId",
    COUNT(*)::INTEGER AS cnt,
    COALESCE(ROUND(AVG("rating")::NUMERIC, 2), 0)::DOUBLE PRECISION AS avg
  FROM "Review"
  WHERE status = 'visible'
  GROUP BY "placeId"
) sub
WHERE p.id = sub."placeId";

-- Keep only the newest review per user/place before adding uniqueness.
DELETE FROM "Review" r
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY "placeId", "userId" ORDER BY "createdAt" DESC) AS rn
    FROM "Review"
  ) ranked
  WHERE ranked.rn > 1
) dup
WHERE r.id = dup.id;

CREATE UNIQUE INDEX IF NOT EXISTS "Review_placeId_userId_key" ON "Review"("placeId", "userId");
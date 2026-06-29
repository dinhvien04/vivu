-- =============================================================================
-- Vivu — Travel Discovery Portal
-- PostgreSQL DDL schema (sinh từ apps/api/prisma/schema.prisma)
-- =============================================================================
--
-- Cách dùng (Neon):
--   1) Trên dashboard Neon, mở SQL Editor của database trống bạn vừa tạo.
--   2) Paste toàn bộ file này, hoặc:
--        psql "$NEON_DATABASE_URL" -f apps/api/prisma/schema.sql
--   3) Sau khi chạy xong, schema đã sẵn sàng cho Prisma client (đã sinh từ
--      cùng `schema.prisma`, nên không cần `prisma migrate deploy` thêm — tuy
--      nhiên nếu bạn dùng Prisma migrate cho production, hãy bỏ qua file này
--      và chạy `pnpm --filter @vivu/api prisma migrate deploy` thay thế).
--   4) (Tùy chọn) seed dữ liệu mẫu:
--        DATABASE_URL=$NEON_DATABASE_URL pnpm --filter @vivu/api prisma:seed
--
-- File này KHÔNG bao gồm dữ liệu — chỉ structure (enums, tables, indexes, FKs).
-- =============================================================================

-- Bật trigram để hỗ trợ search ILIKE / similarity (charter `docs/overview.md`).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Bật PostGIS để dùng kiểu geography(Point, 4326) + ST_DWithin cho /places/nearby.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('visible', 'hidden', 'reported');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "titleEn" TEXT,
    "summaryVi" TEXT,
    "summaryEn" TEXT,
    "descriptionVi" TEXT,
    "descriptionEn" TEXT,
    "regionId" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "bestSeasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PlaceStatus" NOT NULL DEFAULT 'draft',
    "heroImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceCategory" (
    "placeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PlaceCategory_pkey" PRIMARY KEY ("placeId","categoryId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLike" (
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLike_pkey" PRIMARY KEY ("reviewId","userId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","placeId")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","placeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_revokedAt_idx" ON "RefreshToken"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_usedAt_idx" ON "PasswordResetToken"("userId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_regionId_status_idx" ON "Place"("regionId", "status");

-- CreateIndex
CREATE INDEX "Place_status_updatedAt_idx" ON "Place"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Photo_placeId_position_idx" ON "Photo"("placeId", "position");

-- CreateIndex
CREATE INDEX "Review_placeId_createdAt_idx" ON "Review"("placeId", "createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceCategory" ADD CONSTRAINT "PlaceCategory_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceCategory" ADD CONSTRAINT "PlaceCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLike" ADD CONSTRAINT "ReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Index phụ (không nằm trong Prisma schema) — phục vụ search title bằng pg_trgm.
-- Có thể bỏ nếu bạn dùng MeiliSearch.
-- =============================================================================

CREATE INDEX IF NOT EXISTS "Place_titleVi_trgm_idx"
    ON "Place" USING GIN ("titleVi" gin_trgm_ops);

-- =============================================================================
-- PostGIS — cột geography(Point, 4326) + GIST index cho /places/nearby.
-- Cột "geo" được giữ đồng bộ với (lat, lng) qua trigger; service truy vấn
-- ST_DWithin trên cột này (nhanh hơn Haversine khi dataset lớn).
-- =============================================================================

ALTER TABLE "Place"
    ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);

CREATE INDEX IF NOT EXISTS "Place_geo_gist_idx"
    ON "Place" USING GIST ("geo");

CREATE OR REPLACE FUNCTION place_sync_geo() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geo := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    ELSE
        NEW.geo := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS place_geo_sync ON "Place";
CREATE TRIGGER place_geo_sync
    BEFORE INSERT OR UPDATE OF "lat", "lng" ON "Place"
    FOR EACH ROW EXECUTE FUNCTION place_sync_geo();

-- Backfill cột "geo" cho các row đã có lat/lng từ trước.
UPDATE "Place"
SET "geo" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL AND "geo" IS NULL;

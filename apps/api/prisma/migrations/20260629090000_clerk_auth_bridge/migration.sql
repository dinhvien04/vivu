-- Clerk auth bridge. Non-destructive: keep legacy password auth columns and add
-- nullable Clerk/user lifecycle fields for gradual migration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId");

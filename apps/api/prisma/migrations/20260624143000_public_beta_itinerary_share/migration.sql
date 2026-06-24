ALTER TYPE "AnalyticsEventType" ADD VALUE 'trip_plan_feedback_submitted';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'trip_plan_missing_data';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'trip_plan_shared';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'trip_plan_copied';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'ai_feedback_submitted';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'ai_missing_context';

ALTER TABLE "TripPlan" ADD COLUMN "shareId" TEXT;
ALTER TABLE "TripPlan" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "TripPlan_shareId_key" ON "TripPlan"("shareId");

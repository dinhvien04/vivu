-- Business MVP: AI trip plans, leads, lightweight analytics, and data reports.

CREATE TYPE "LeadSource" AS ENUM ('place_detail', 'ai_chat', 'trip_planner', 'home', 'other');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'planning', 'booked', 'cancelled', 'spam');
CREATE TYPE "DataReportType" AS ENUM ('wrong_image', 'wrong_coordinates', 'wrong_description', 'missing_info', 'other');
CREATE TYPE "DataReportStatus" AS ENUM ('new', 'reviewed', 'resolved', 'rejected');
CREATE TYPE "AnalyticsEventType" AS ENUM ('place_view', 'ai_chat_started', 'trip_plan_generated', 'lead_submitted', 'search_performed', 'nearby_clicked');

ALTER TABLE "AiUsage"
  ADD COLUMN "tripPlanRequests" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TripPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TripPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripPlanPlace" (
  "tripPlanId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TripPlanPlace_pkey" PRIMARY KEY ("tripPlanId", "placeId")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phoneOrZalo" TEXT NOT NULL,
  "email" TEXT,
  "interestedPlaceSlug" TEXT,
  "interestedPlaceName" TEXT,
  "area" TEXT,
  "travelDate" TIMESTAMP(3),
  "peopleCount" INTEGER,
  "budget" TEXT,
  "note" TEXT,
  "source" "LeadSource" NOT NULL DEFAULT 'other',
  "status" "LeadStatus" NOT NULL DEFAULT 'new',
  "internalNote" TEXT,
  "estimatedValue" TEXT,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataReport" (
  "id" TEXT NOT NULL,
  "placeSlug" TEXT NOT NULL,
  "type" "DataReportType" NOT NULL,
  "message" TEXT NOT NULL,
  "contact" TEXT,
  "status" "DataReportStatus" NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" "AnalyticsEventType" NOT NULL,
  "placeSlug" TEXT,
  "userId" TEXT,
  "sessionHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripPlan_userId_createdAt_idx" ON "TripPlan"("userId", "createdAt");
CREATE INDEX "TripPlan_createdAt_idx" ON "TripPlan"("createdAt");
CREATE INDEX "TripPlanPlace_placeId_idx" ON "TripPlanPlace"("placeId");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");
CREATE INDEX "Lead_interestedPlaceSlug_idx" ON "Lead"("interestedPlaceSlug");
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");
CREATE INDEX "DataReport_placeSlug_idx" ON "DataReport"("placeSlug");
CREATE INDEX "DataReport_status_createdAt_idx" ON "DataReport"("status", "createdAt");
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_placeSlug_createdAt_idx" ON "AnalyticsEvent"("placeSlug", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

ALTER TABLE "TripPlan"
  ADD CONSTRAINT "TripPlan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPlanPlace"
  ADD CONSTRAINT "TripPlanPlace_tripPlanId_fkey"
  FOREIGN KEY ("tripPlanId") REFERENCES "TripPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPlanPlace"
  ADD CONSTRAINT "TripPlanPlace_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

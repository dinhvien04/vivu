import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { KvModule } from './common/kv.module';
import { RateLimiterModule } from './common/rate-limiter.module';
import {
  assertThrottlerStorageReady,
  UpstashThrottlerStorage,
} from './common/upstash-throttler.storage';
import { AdminPlacesModule } from './admin-places/admin-places.module';
import { AdminReviewsModule } from './admin-reviews/admin-reviews.module';
import { AdminStatsModule } from './admin-stats/admin-stats.module';
import { AbuseProtectionModule } from './common/abuse-protection.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CollectionsModule } from './collections/collections.module';
import { HealthController } from './common/health.controller';
import { DataReportsModule } from './data-reports/data-reports.module';
import { FavoritesModule } from './favorites/favorites.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';
import { PlacesModule } from './places/places.module';
import { PrismaModule } from './prisma/prisma.module';
import { QaModule } from './qa/qa.module';
import { RegionsModule } from './regions/regions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { AiModule } from './ai/ai.module';
import { GeminiModule } from './gemini/gemini.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { StorageModule } from './storage/storage.module';
import { TripPlansModule } from './trip-plans/trip-plans.module';

assertThrottlerStorageReady();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: positiveInteger(process.env.GLOBAL_RATE_LIMIT_PER_MINUTE, 120),
        },
      ],
      storage: new UpstashThrottlerStorage(),
    }),
    RateLimiterModule,
    KvModule,
    AbuseProtectionModule,
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    PlacesModule,
    RegionsModule,
    CategoriesModule,
    SearchModule,
    FavoritesModule,
    ReviewsModule,
    CollectionsModule,
    QaModule,
    AuditLogsModule,
    AdminPlacesModule,
    AdminReviewsModule,
    AdminStatsModule,
    AnalyticsModule,
    LeadsModule,
    DataReportsModule,
    TripPlansModule,
    MediaModule,
    QdrantModule,
    GeminiModule,
    StorageModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

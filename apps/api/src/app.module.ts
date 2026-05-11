import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminPlacesModule } from './admin-places/admin-places.module';
import { AdminReviewsModule } from './admin-reviews/admin-reviews.module';
import { AdminStatsModule } from './admin-stats/admin-stats.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CollectionsModule } from './collections/collections.module';
import { HealthController } from './common/health.controller';
import { FavoritesModule } from './favorites/favorites.module';
import { MediaModule } from './media/media.module';
import { PlacesModule } from './places/places.module';
import { PrismaModule } from './prisma/prisma.module';
import { QaModule } from './qa/qa.module';
import { RegionsModule } from './regions/regions.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    PlacesModule,
    RegionsModule,
    CategoriesModule,
    FavoritesModule,
    ReviewsModule,
    CollectionsModule,
    QaModule,
    AdminPlacesModule,
    AdminReviewsModule,
    AdminStatsModule,
    MediaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminPlacesModule } from './admin-places/admin-places.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { HealthController } from './common/health.controller';
import { FavoritesModule } from './favorites/favorites.module';
import { PlacesModule } from './places/places.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegionsModule } from './regions/regions.module';

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
    AdminPlacesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

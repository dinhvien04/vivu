import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { HealthController } from './common/health.controller';
import { PlacesModule } from './places/places.module';
import { PrismaModule } from './prisma/prisma.module';

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
    PlacesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

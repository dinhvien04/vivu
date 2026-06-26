import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const url = process.env.DATABASE_URL || '';
    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    if (isProduction) {
      try {
        const hostname = url.split('@')[1]?.split('/')[0]?.split('?')[0];
        if (hostname && hostname.includes('neon.tech') && !hostname.includes('-pooler')) {
          this.logger.warn(
            'Production DATABASE_URL appears to use a direct Neon connection. Use pooled -pooler URL for API runtime; keep direct URL for migrations.',
          );
        }
      } catch {
        // Ignore URL parsing errors
      }
    }
    await this.$connect();
    this.logger.log('Prisma connected to Postgres');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

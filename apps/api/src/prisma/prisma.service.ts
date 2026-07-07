import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseHostname } from '../common/database-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    if (isProduction) {
      const hostname = parseDatabaseHostname(process.env.DATABASE_URL);
      if (hostname?.includes('neon.tech') && !hostname.includes('-pooler')) {
        this.logger.warn(
          'Production DATABASE_URL appears to use a direct Neon connection. Use pooled -pooler URL for API runtime; keep direct URL for migrations.',
        );
      }
    }
    await this.$connect();
    this.logger.log('Prisma connected to Postgres');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

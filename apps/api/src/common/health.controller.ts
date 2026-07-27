import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('healthz')
  healthz() {
    return { status: 'ok' };
  }

  @Get('readyz')
  async readyz() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'unavailable',
      });
    }
  }

  @Get('build-info')
  buildInfo() {
    return {
      app: 'vivu-api',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || 'unknown',
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE?.trim() || 'unknown',
      vercelEnv: process.env.VERCEL_ENV?.trim() || 'unknown',
      nodeEnv: process.env.NODE_ENV?.trim() || 'development',
      buildTime: process.env.BUILD_TIME?.trim() || new Date().toISOString(),
    };
  }
}

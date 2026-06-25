import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('healthz')
  healthz() {
    return { status: 'ok' };
  }

  @Get('readyz')
  readyz() {
    return { status: 'ready' };
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

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { GenerateTripPlanDto } from './dto/generate-trip-plan.dto';
import { TripPlansService } from './trip-plans.service';

const TRIP_PLANNER_RATE_LIMIT_PER_MINUTE = positiveInteger(
  process.env.TRIP_PLANNER_RATE_LIMIT_PER_MINUTE,
  5,
);

@ApiTags('trip-plans')
@Controller('trip-plans')
export class TripPlansController {
  constructor(
    private readonly tripPlans: TripPlansService,
    private readonly audit: AuditLogsService,
  ) {}

  @Post('generate')
  @Throttle({ default: { ttl: 60_000, limit: TRIP_PLANNER_RATE_LIMIT_PER_MINUTE } })
  @UseGuards(OptionalJwtAuthGuard)
  generate(
    @Body() dto: GenerateTripPlanDto,
    @Req() request: FastifyRequest,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    if (process.env.TRIP_PLANNER_FEATURE_ENABLED === 'false') {
      throw new ServiceUnavailableException(
        'Tính năng tạo lịch trình AI đang tạm bảo trì, vui lòng gửi yêu cầu tư vấn để Vivu hỗ trợ.',
      );
    }
    return this.tripPlans.generate(dto, request, user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tripPlans.listMine(user.id);
  }

  @Get('shared/:shareId')
  getShared(@Param('shareId') shareId: string) {
    return this.tripPlans.getShared(shareId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripPlans.getMine(user.id, id);
  }

  @Post(':id/share')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async share(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.tripPlans.share(user.id, id);
    await this.audit.record({
      actorId: user.id,
      action: 'trip_plan.share',
      entityType: 'trip_plan',
      entityId: id,
    });
    return result;
  }

  @Post(':id/unshare')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async unshare(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const result = await this.tripPlans.unshare(user.id, id);
    await this.audit.record({
      actorId: user.id,
      action: 'trip_plan.unshare',
      entityType: 'trip_plan',
      entityId: id,
    });
    return result;
  }

  @Post(':id/save-to-collection')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  saveToCollection(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripPlans.saveToCollection(user.id, id);
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

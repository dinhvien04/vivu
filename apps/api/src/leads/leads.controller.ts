import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

const LEADS_RATE_LIMIT_PER_HOUR = positiveInteger(process.env.LEADS_RATE_LIMIT_PER_HOUR, 5);

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Throttle({ default: { ttl: 3_600_000, limit: LEADS_RATE_LIMIT_PER_HOUR } })
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() dto: CreateLeadDto,
    @Req() request: FastifyRequest,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.leads.create(dto, request, user);
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

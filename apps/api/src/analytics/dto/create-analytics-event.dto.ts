import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const ANALYTICS_EVENT_TYPES = [
  'place_view',
  'ai_chat_started',
  'trip_plan_generated',
  'lead_submitted',
  'search_performed',
  'nearby_clicked',
] as const;

export class CreateAnalyticsEventDto {
  @ApiProperty({ enum: ANALYTICS_EVENT_TYPES })
  @IsIn(ANALYTICS_EVENT_TYPES as unknown as string[])
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

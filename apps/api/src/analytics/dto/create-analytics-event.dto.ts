import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const ANALYTICS_EVENT_TYPES = [
  'place_view',
  'ai_chat_started',
  'home_trip_planner_cta_clicked',
  'home_consulting_cta_clicked',
  'trip_plan_generate_clicked',
  'trip_plan_generated',
  'trip_plan_failed',
  'lead_submitted',
  'lead_form_submitted',
  'detail_consulting_clicked',
  'detail_report_clicked',
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

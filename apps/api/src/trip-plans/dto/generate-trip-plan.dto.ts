import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const TRIP_PLAN_AREAS = [
  'all',
  'pleiku',
  'quy-nhon',
  'an-nhon',
  'tuy-phuoc',
  'phu-cat',
  'phu-my',
  'hoai-nhon',
] as const;

export const TRIP_PLAN_TRANSPORTS = ['xe_may', 'oto', 'xe_khach', 'di_bo_ket_hop'] as const;
export const TRIP_PLAN_LOCALES = ['vi', 'en'] as const;

export class GenerateTripPlanDto {
  @ApiPropertyOptional({ enum: TRIP_PLAN_AREAS, default: 'all' })
  @IsOptional()
  @IsIn(TRIP_PLAN_AREAS as unknown as string[])
  area?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  days!: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  peopleCount?: number;

  @ApiPropertyOptional({ enum: TRIP_PLAN_TRANSPORTS })
  @IsOptional()
  @IsIn(TRIP_PLAN_TRANSPORTS as unknown as string[])
  transport?: string;

  @ApiProperty({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  interests!: string[];

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  budget?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ enum: TRIP_PLAN_LOCALES, default: 'vi' })
  @IsOptional()
  @IsIn(TRIP_PLAN_LOCALES as unknown as string[])
  locale?: 'vi' | 'en';
}

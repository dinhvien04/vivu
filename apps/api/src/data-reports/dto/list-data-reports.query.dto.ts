import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DATA_REPORT_TYPES } from './create-data-report.dto';

export const DATA_REPORT_STATUSES = ['new', 'reviewed', 'resolved', 'rejected'] as const;

export class ListDataReportsQueryDto {
  @ApiPropertyOptional({ enum: DATA_REPORT_STATUSES })
  @IsOptional()
  @IsIn(DATA_REPORT_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ enum: DATA_REPORT_TYPES })
  @IsOptional()
  @IsIn(DATA_REPORT_TYPES as unknown as string[])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  placeSlug?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class UpdateDataReportStatusDto {
  @ApiPropertyOptional({ enum: DATA_REPORT_STATUSES })
  @IsIn(DATA_REPORT_STATUSES as unknown as string[])
  status!: string;
}

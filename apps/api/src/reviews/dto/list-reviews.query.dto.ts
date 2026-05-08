import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const REVIEW_STATUSES = ['visible', 'hidden', 'reported'] as const;
export type ReviewStatusValue = (typeof REVIEW_STATUSES)[number];

export class ListReviewsQueryDto {
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

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái (chỉ admin được dùng).',
    enum: REVIEW_STATUSES,
  })
  @IsOptional()
  @IsIn(REVIEW_STATUSES as unknown as string[])
  status?: ReviewStatusValue;
}

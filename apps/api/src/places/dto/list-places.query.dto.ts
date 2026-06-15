import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export const PLACE_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type PlaceSeason = (typeof PLACE_SEASONS)[number];

export const PLACE_SORTS = ['recent', 'name'] as const;
export type PlaceSort = (typeof PLACE_SORTS)[number];

export class ListPlacesQueryDto {
  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm theo tên/mô tả.' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Lọc theo region slug.' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Lọc theo category slug.' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by province.' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo mùa đẹp nhất.',
    enum: PLACE_SEASONS,
  })
  @IsOptional()
  @IsIn(PLACE_SEASONS as unknown as string[])
  season?: PlaceSeason;

  @ApiPropertyOptional({
    description: 'Filter places by coordinate availability.',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasGeo?: boolean;

  @ApiPropertyOptional({
    description: 'Filter places by hero image availability.',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasHeroImage?: boolean;

  @ApiPropertyOptional({
    description: 'Sắp xếp kết quả.',
    enum: PLACE_SORTS,
    default: 'recent',
  })
  @IsOptional()
  @IsIn(PLACE_SORTS as unknown as string[])
  sort?: PlaceSort;

  @ApiPropertyOptional({
    description: 'Lọc theo điểm đánh giá tối thiểu (1.0 — 5.0).',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Trang hiện tại (>=1).', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Số phần tử mỗi trang.', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

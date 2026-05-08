import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Lọc theo mùa đẹp nhất.',
    enum: PLACE_SEASONS,
  })
  @IsOptional()
  @IsIn(PLACE_SEASONS as unknown as string[])
  season?: PlaceSeason;

  @ApiPropertyOptional({
    description: 'Sắp xếp kết quả.',
    enum: PLACE_SORTS,
    default: 'recent',
  })
  @IsOptional()
  @IsIn(PLACE_SORTS as unknown as string[])
  sort?: PlaceSort;

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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PLACE_SEASONS } from '../../places/dto/list-places.query.dto';

export const PLACE_STATUSES = ['draft', 'published', 'archived'] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class GeoPointDto {
  @ApiProperty({ description: 'Vĩ độ (-90 to 90).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ description: 'Kinh độ (-180 to 180).' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class CreatePlaceDto {
  @ApiProperty({ description: 'Slug duy nhất (chữ thường, dấu gạch ngang).' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, {
    message: 'slug phải gồm chữ thường, số, dấu gạch ngang (ví dụ: vinh-ha-long).',
  })
  slug!: string;

  @ApiProperty({ description: 'Tên (tiếng Việt).' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titleVi!: string;

  @ApiPropertyOptional({ description: 'Tên (English).' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Tóm tắt ngắn (tiếng Việt).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summaryVi?: string;

  @ApiPropertyOptional({ description: 'Tóm tắt ngắn (English).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summaryEn?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết (Markdown, tiếng Việt).' })
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết (Markdown, English).' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ description: 'Region id (cuid).' })
  @IsString()
  regionId!: string;

  @ApiPropertyOptional({ description: 'Địa chỉ.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ description: 'Toạ độ.' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;

  @ApiPropertyOptional({
    description: 'Mảng mùa đẹp nhất.',
    isArray: true,
    enum: PLACE_SEASONS,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(4)
  @IsIn(PLACE_SEASONS as unknown as string[], { each: true })
  bestSeasons?: string[];

  @ApiPropertyOptional({
    description: 'Trạng thái xuất bản.',
    enum: PLACE_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(PLACE_STATUSES as unknown as string[])
  status?: PlaceStatus;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Mảng category id (cuid) gắn với địa điểm.',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  categoryIds?: string[];
}

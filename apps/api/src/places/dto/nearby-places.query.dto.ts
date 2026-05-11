import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class NearbyPlacesQueryDto {
  @ApiProperty({ description: 'Vĩ độ.', example: 21.0285 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ description: 'Kinh độ.', example: 105.8542 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({
    description: 'Bán kính tìm kiếm (km).',
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  radius?: number;

  @ApiPropertyOptional({
    description: 'Số lượng tối đa trả về.',
    default: 8,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;

  @ApiPropertyOptional({ description: 'Slug muốn loại trừ (ví dụ trang chi tiết hiện tại).' })
  @IsOptional()
  @IsString()
  excludeSlug?: string;
}

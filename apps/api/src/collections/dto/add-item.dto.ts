import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddCollectionItemDto {
  @ApiProperty({ description: 'ID hoặc slug của địa điểm cần thêm vào sổ tay.' })
  @IsString()
  @MinLength(1)
  placeIdOrSlug!: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Ghi chú riêng cho mục này.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AddPhotoDto {
  @ApiProperty({
    description: 'Secure URL trên Cloudinary trả về sau khi upload.',
    example: 'https://res.cloudinary.com/demo/image/upload/v1700/vivu/places/abc.jpg',
  })
  @IsUrl({ require_protocol: true })
  url!: string;

  @ApiPropertyOptional({
    description: 'public_id Cloudinary, dùng để xoá asset.',
    example: 'vivu/places/abc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  width?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  height?: number;

  @ApiPropertyOptional({ description: 'Mô tả ảnh (alt text).' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu ảnh bìa.' })
  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}

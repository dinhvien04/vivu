import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ minLength: 1, maxLength: 120, description: 'Tên sổ tay.' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Mô tả ngắn.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: false, description: 'Cho phép chia sẻ công khai.' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

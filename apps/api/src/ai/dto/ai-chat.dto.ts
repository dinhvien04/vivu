import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AiChatDto {
  @ApiPropertyOptional({ example: 'Biển Hồ Gia Lai có gì đẹp?' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ name: 'session_id', example: 'demo-text-1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  session_id?: string;
}

export class AiDebugTextDto {
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  placeSlug?: string;
}

export class AiDebugImageUrlDto {
  @IsString()
  imageUrl: string;
}

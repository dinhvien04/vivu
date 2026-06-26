import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const DATA_REPORT_TYPES = [
  'wrong_image',
  'wrong_coordinates',
  'wrong_description',
  'missing_info',
  'other',
] as const;

export class CreateDataReportDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  placeSlug!: string;

  @ApiProperty({ enum: DATA_REPORT_TYPES })
  @IsIn(DATA_REPORT_TYPES as unknown as string[])
  type!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  message!: string;

  @ApiPropertyOptional({ maxLength: 254 })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  contact?: string;

  @ApiPropertyOptional({ description: 'Hidden bot trap field.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile response token.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string;
}

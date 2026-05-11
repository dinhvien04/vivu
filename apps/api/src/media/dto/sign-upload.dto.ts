import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SignUploadDto {
  @ApiPropertyOptional({
    description: 'Folder trên Cloudinary (vd: vivu/places, vivu/avatars). Mặc định: vivu/places.',
    example: 'vivu/places',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9/_-]+$/i, {
    message: 'folder chỉ được chứa chữ, số, _, -, /',
  })
  folder?: string;

  @ApiPropertyOptional({
    description: 'public_id mong muốn (slug + suffix). Nếu bỏ trống, Cloudinary tự sinh.',
    example: 'vinh-ha-long-1700000000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'publicId chỉ được chứa chữ, số, _, -',
  })
  publicId?: string;
}

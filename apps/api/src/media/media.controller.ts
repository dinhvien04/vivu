import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CloudinaryService, type SignedUploadParams } from '../cloudinary/cloudinary.service';
import { SignUploadDto } from './dto/sign-upload.dto';

@ApiTags('admin/media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('sign')
  sign(@Body() dto: SignUploadDto): { data: SignedUploadParams } {
    if (!this.cloudinary.isConfigured()) {
      throw new HttpException(
        'Cloudinary chưa cấu hình. Vui lòng cấu hình CLOUDINARY_URL trên server.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const data = this.cloudinary.signUploadParams({
      folder: dto.folder,
      publicId: dto.publicId,
    });
    return { data };
  }
}

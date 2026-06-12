import { BadRequestException, Injectable } from '@nestjs/common';
import type { AiInputType, AiUploadedImage } from '../types/ai.types';

@Injectable()
export class InputRouterService {
  route(message?: string, image?: AiUploadedImage): AiInputType {
    const hasMessage = Boolean(message?.trim());
    const hasImage = Boolean(image);
    if (hasMessage && hasImage) return 'image_text';
    if (hasMessage) return 'text_only';
    if (hasImage) return 'image_only';
    throw new BadRequestException('Cần cung cấp message, image hoặc cả hai.');
  }
}

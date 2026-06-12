import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantRepository } from '../../qdrant/qdrant.repository';
import { S3Service } from '../../storage/s3.service';
import { ResponseFormatterService } from '../services/response-formatter.service';
import type { AiChatResponse, AiUploadedImage } from '../types/ai.types';

@Injectable()
export class ImageOnlyPipeline {
  private readonly topK: number;
  private readonly threshold: number;

  constructor(
    config: ConfigService,
    private readonly qdrant: QdrantRepository,
    private readonly s3: S3Service,
    private readonly formatter: ResponseFormatterService,
  ) {
    this.topK = Number(config.get<string>('TOP_K_IMAGES') ?? 5);
    this.threshold = Number(config.get<string>('IMAGE_MATCH_THRESHOLD') ?? 0.25);
  }

  async run(image: AiUploadedImage): Promise<AiChatResponse> {
    const imageResults = await this.searchImage(image);
    const top = imageResults[0];
    if (!top || top.score < this.threshold) {
      return this.formatter.format({
        inputType: 'image_only',
        answer:
          'Mình chưa nhận diện được địa điểm trong ảnh với độ tin cậy đủ cao. Bạn có thể gửi ảnh rõ hơn hoặc thêm câu hỏi mô tả địa điểm.',
        imageResults,
      });
    }

    const placeName = top.location_name ?? top.place_slug ?? 'địa điểm này';
    const answer = `Ảnh có độ tương đồng cao nhất với ${placeName} (${(top.score * 100).toFixed(1)}%).`;
    return this.formatter.format({
      inputType: 'image_only',
      answer,
      imageResults,
      detectedPlaceSlug: top.place_slug,
    });
  }

  private async searchImage(image: AiUploadedImage) {
    const base64 = image.buffer.toString('base64');
    try {
      return await this.qdrant.searchImagesByImageBase64(base64, { limit: this.topK });
    } catch {
      const temporary = await this.s3.uploadTemporaryImage(image.buffer, image.contentType);
      return this.qdrant.searchImagesByImageUrl(temporary.presignedUrl, {
        limit: this.topK,
      });
    }
  }
}

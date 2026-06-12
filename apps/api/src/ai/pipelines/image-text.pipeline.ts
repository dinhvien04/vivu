import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../gemini/gemini.service';
import { QdrantRepository } from '../../qdrant/qdrant.repository';
import { S3Service } from '../../storage/s3.service';
import { ContextBuilderService } from '../services/context-builder.service';
import { ResponseFormatterService } from '../services/response-formatter.service';
import type { AiChatResponse, AiUploadedImage } from '../types/ai.types';

@Injectable()
export class ImageTextPipeline {
  private readonly topKText: number;
  private readonly topKImages: number;
  private readonly threshold: number;

  constructor(
    config: ConfigService,
    private readonly qdrant: QdrantRepository,
    private readonly gemini: GeminiService,
    private readonly s3: S3Service,
    private readonly contextBuilder: ContextBuilderService,
    private readonly formatter: ResponseFormatterService,
  ) {
    this.topKText = Number(config.get<string>('TOP_K_TEXT') ?? 5);
    this.topKImages = Number(config.get<string>('TOP_K_IMAGES') ?? 5);
    this.threshold = Number(config.get<string>('IMAGE_MATCH_THRESHOLD') ?? 0.25);
  }

  async run(message: string, image: AiUploadedImage): Promise<AiChatResponse> {
    this.s3.assertConfigured();
    const imageResults = await this.searchImage(image);
    const top = imageResults[0];
    const detectedPlaceSlug = top && top.score >= this.threshold ? top.place_slug : undefined;
    const textResults = await this.qdrant.searchTextByMessage(message, {
      limit: this.topKText,
      placeSlug: detectedPlaceSlug,
    });
    const context = [
      this.contextBuilder.fromTextResults(textResults),
      this.contextBuilder.fromImageResults(imageResults),
    ]
      .filter(Boolean)
      .join('\n\n');
    const answer = await this.gemini.generateTravelAnswer({
      question: message,
      context,
      detectedPlace: top
        ? {
            slug: detectedPlaceSlug,
            name: top.location_name,
            score: top.score,
          }
        : undefined,
      matchedImages: imageResults,
    });
    return this.formatter.format({
      inputType: 'image_text',
      answer,
      textResults,
      imageResults,
      detectedPlaceSlug,
    });
  }

  private async searchImage(image: AiUploadedImage) {
    try {
      return await this.qdrant.searchImagesByImageBase64(image.buffer.toString('base64'), {
        limit: this.topKImages,
      });
    } catch {
      const temporary = await this.s3.uploadTemporaryImage(image.buffer, image.contentType);
      return this.qdrant.searchImagesByImageUrl(temporary.presignedUrl, {
        limit: this.topKImages,
      });
    }
  }
}

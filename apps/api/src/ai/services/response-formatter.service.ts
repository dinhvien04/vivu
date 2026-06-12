import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { QdrantService } from '../../qdrant/qdrant.service';
import type { QdrantImageResult, QdrantTextResult } from '../../qdrant/qdrant.types';
import type {
  AiChatResponse,
  AiMatchedImage,
  AiPlaceResult,
  AiSource,
  AiRetrievalBundle,
} from '../types/ai.types';
import { ImageUrlService } from './image-url.service';

@Injectable()
export class ResponseFormatterService {
  constructor(
    private readonly imageUrls: ImageUrlService,
    private readonly qdrant: QdrantService,
    private readonly gemini: GeminiService,
  ) {}

  async format(bundle: AiRetrievalBundle): Promise<AiChatResponse> {
    const textResults = bundle.textResults ?? [];
    const imageResults = bundle.imageResults ?? [];
    const matchedImages = await this.mapMatchedImages(imageResults);
    const places = await this.mapPlaces(textResults, imageResults, matchedImages);
    const sources = await this.mapSources(textResults, imageResults, matchedImages);

    return {
      success: true,
      input_type: bundle.inputType,
      answer: bundle.answer,
      places: places.length > 0 ? places : undefined,
      sources: sources.length > 0 ? sources : undefined,
      matched_images: matchedImages.length > 0 ? matchedImages : undefined,
      debug: {
        textResults: textResults.length,
        imageResults: imageResults.length,
        detectedPlaceSlug: bundle.detectedPlaceSlug,
        qdrantTextModel: this.qdrant.textModel,
        qdrantImageModel: this.qdrant.imageModel,
        geminiModel: this.gemini.model,
      },
    };
  }

  private async mapMatchedImages(results: QdrantImageResult[]): Promise<AiMatchedImage[]> {
    return Promise.all(
      results.map(async (item) => ({
        location_name: item.location_name,
        place_slug: item.place_slug,
        s3_key: item.s3_key,
        image_url: await this.imageUrls.resolve(item.s3_key),
        score: item.score,
      })),
    );
  }

  private async mapPlaces(
    textResults: QdrantTextResult[],
    imageResults: QdrantImageResult[],
    matchedImages: AiMatchedImage[],
  ): Promise<AiPlaceResult[]> {
    const places = new Map<string, AiPlaceResult>();
    for (const item of [...imageResults, ...textResults]) {
      const key = item.place_slug ?? item.location_key ?? item.location_name;
      if (!key || places.has(key)) continue;
      const thumbnail = matchedImages.find((image) => image.place_slug === item.place_slug);
      places.set(key, {
        slug: item.place_slug,
        name: item.location_name,
        province: item.province,
        score: item.score,
        thumbnail_url: thumbnail?.image_url,
      });
    }
    return [...places.values()];
  }

  private async mapSources(
    textResults: QdrantTextResult[],
    imageResults: QdrantImageResult[],
    matchedImages: AiMatchedImage[],
  ): Promise<AiSource[]> {
    const textSources: AiSource[] = textResults.map((item) => ({
      type: 'text',
      title: item.location_name,
      source_file: item.source_file,
      s3_key: item.s3_key,
      score: item.score,
    }));
    const imageSources: AiSource[] = imageResults.map((item, index) => ({
      type: 'image',
      title: item.location_name ?? item.filename,
      s3_key: item.s3_key,
      url: matchedImages[index]?.image_url,
      score: item.score,
    }));
    return [...textSources, ...imageSources];
  }
}

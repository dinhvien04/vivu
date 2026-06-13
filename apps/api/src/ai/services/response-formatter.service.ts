import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../gemini/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
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

interface PlaceLabel {
  name: string;
  slug: string;
  province?: string | null;
}

@Injectable()
export class ResponseFormatterService {
  constructor(
    private readonly imageUrls: ImageUrlService,
    private readonly qdrant: QdrantService,
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  async format(bundle: AiRetrievalBundle): Promise<AiChatResponse> {
    const textResults = bundle.textResults ?? [];
    const imageResults = bundle.imageResults ?? [];
    const placeLookup = await this.loadPlaceLookup(textResults, imageResults);
    const matchedImages = await this.mapMatchedImages(imageResults, placeLookup);
    const places = await this.mapPlaces(textResults, imageResults, matchedImages, placeLookup);
    const sources = await this.mapSources(textResults, imageResults, matchedImages, placeLookup);

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

  private async mapMatchedImages(
    results: QdrantImageResult[],
    placeLookup: Map<string, PlaceLabel>,
  ): Promise<AiMatchedImage[]> {
    return Promise.all(
      results.map(async (item) => {
        const place = this.findPlace(item, placeLookup);
        return {
          location_name: place?.name ?? item.location_name,
          place_slug: place?.slug ?? item.place_slug,
          s3_key: item.s3_key,
          image_url: await this.imageUrls.resolve(item.s3_key),
          score: item.score,
        };
      }),
    );
  }

  private async mapPlaces(
    textResults: QdrantTextResult[],
    imageResults: QdrantImageResult[],
    matchedImages: AiMatchedImage[],
    placeLookup: Map<string, PlaceLabel>,
  ): Promise<AiPlaceResult[]> {
    const places = new Map<string, AiPlaceResult>();
    for (const item of [...imageResults, ...textResults]) {
      const place = this.findPlace(item, placeLookup);
      const key = place?.slug ?? item.place_slug ?? item.location_key ?? item.location_name;
      if (!key || places.has(key)) continue;
      const thumbnail = matchedImages.find(
        (image) => image.place_slug === (place?.slug ?? item.place_slug),
      );
      places.set(key, {
        slug: place?.slug ?? item.place_slug,
        name: place?.name ?? item.location_name,
        province: place?.province ?? item.province,
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
    placeLookup: Map<string, PlaceLabel>,
  ): Promise<AiSource[]> {
    const textSources: AiSource[] = textResults.map((item) => {
      const place = this.findPlace(item, placeLookup);
      return {
        type: 'text',
        title: place?.name ?? item.location_name,
        source_file: item.source_file,
        s3_key: item.s3_key,
        score: item.score,
      };
    });
    const imageSources: AiSource[] = imageResults.map((item, index) => {
      const place = this.findPlace(item, placeLookup);
      return {
        type: 'image',
        title: place?.name ?? item.location_name ?? item.filename,
        s3_key: item.s3_key,
        url: matchedImages[index]?.image_url,
        score: item.score,
      };
    });
    return [...textSources, ...imageSources];
  }

  private async loadPlaceLookup(
    textResults: QdrantTextResult[],
    imageResults: QdrantImageResult[],
  ): Promise<Map<string, PlaceLabel>> {
    const slugs = new Set<string>();
    const locationKeys = new Set<string>();

    for (const item of [...textResults, ...imageResults]) {
      if (item.place_slug) slugs.add(item.place_slug);
      if (item.location_key) locationKeys.add(item.location_key);
    }

    if (slugs.size === 0 && locationKeys.size === 0) return new Map();

    const places = await this.prisma.place.findMany({
      where: {
        OR: [
          slugs.size > 0 ? { slug: { in: [...slugs] } } : undefined,
          locationKeys.size > 0 ? { locationKey: { in: [...locationKeys] } } : undefined,
        ].filter(Boolean) as Array<{ slug?: { in: string[] }; locationKey?: { in: string[] } }>,
      },
      select: {
        locationKey: true,
        slug: true,
        titleVi: true,
        province: true,
      },
    });

    const lookup = new Map<string, PlaceLabel>();
    for (const place of places) {
      const label = {
        name: place.titleVi,
        slug: place.slug,
        province: place.province,
      };
      lookup.set(place.slug, label);
      if (place.locationKey) lookup.set(place.locationKey, label);
    }
    return lookup;
  }

  private findPlace(
    item: QdrantTextResult | QdrantImageResult,
    lookup: Map<string, PlaceLabel>,
  ): PlaceLabel | undefined {
    return (item.place_slug && lookup.get(item.place_slug)) ||
      (item.location_key && lookup.get(item.location_key)) ||
      undefined;
  }
}

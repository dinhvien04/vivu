import { Injectable } from '@nestjs/common';
import type { Schemas } from '@qdrant/js-client-rest';
import { QdrantService } from './qdrant.service';
import type {
  QdrantFilter,
  QdrantImagePayload,
  QdrantImageResult,
  QdrantTextPayload,
  QdrantTextResult,
} from './qdrant.types';

type ScoredPoint = Schemas['ScoredPoint'];

@Injectable()
export class QdrantRepository {
  constructor(private readonly qdrant: QdrantService) {}

  async searchTextByMessage(
    message: string,
    options: { limit?: number; placeSlug?: string } = {},
  ): Promise<QdrantTextResult[]> {
    this.qdrant.assertConfigured();
    const response = await this.qdrant.client.query(this.qdrant.textCollection, {
      query: {
        text: `query: ${message}`,
        model: this.qdrant.textModel,
      },
      filter: options.placeSlug ? buildPlaceSlugFilter(options.placeSlug) : undefined,
      limit: options.limit ?? 5,
      with_payload: true,
      with_vector: false,
    });
    return response.points.map((point) => mapTextPoint(point));
  }

  async searchImagesByText(
    text: string,
    options: { limit?: number } = {},
  ): Promise<QdrantImageResult[]> {
    return this.searchImages(
      {
        text,
        model: this.qdrant.imageTextModel,
      },
      options.limit,
    );
  }

  async searchImagesByImageUrl(
    imageUrl: string,
    options: { limit?: number } = {},
  ): Promise<QdrantImageResult[]> {
    return this.searchImages(
      {
        image: imageUrl,
        model: this.qdrant.imageModel,
      },
      options.limit,
    );
  }

  async searchImagesByImageBase64(
    base64: string,
    options: { limit?: number } = {},
  ): Promise<QdrantImageResult[]> {
    return this.searchImages(
      {
        image: base64,
        model: this.qdrant.imageModel,
      },
      options.limit,
    );
  }

  private async searchImages(
    query: Schemas['Image'] | Schemas['Document'],
    limit = 5,
  ): Promise<QdrantImageResult[]> {
    this.qdrant.assertConfigured();
    const response = await this.qdrant.client.query(this.qdrant.imageCollection, {
      query,
      limit,
      with_payload: true,
      with_vector: false,
    });
    return response.points.map((point) => mapImagePoint(point));
  }
}

export function buildPlaceSlugFilter(placeSlug: string): QdrantFilter {
  return {
    must: [
      {
        key: 'place_slug',
        match: { value: placeSlug },
      },
    ],
  };
}

function pointId(point: ScoredPoint): string | number {
  return typeof point.id === 'object' ? JSON.stringify(point.id) : point.id;
}

function mapTextPoint(point: ScoredPoint): QdrantTextResult {
  const payload = (point.payload ?? {}) as QdrantTextPayload;
  return { id: pointId(point), score: point.score, ...payload };
}

function mapImagePoint(point: ScoredPoint): QdrantImageResult {
  const payload = (point.payload ?? {}) as QdrantImagePayload;
  return { id: pointId(point), score: point.score, ...payload };
}

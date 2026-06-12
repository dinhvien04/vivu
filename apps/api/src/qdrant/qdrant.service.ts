import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { QdrantCollectionHealth } from './qdrant.types';

@Injectable()
export class QdrantService {
  readonly textCollection: string;
  readonly imageCollection: string;
  readonly textModel: string;
  readonly imageModel: string;
  readonly imageTextModel: string;
  readonly client: QdrantClient;

  private readonly url?: string;
  private readonly apiKey?: string;

  constructor(config: ConfigService) {
    this.url = config.get<string>('QDRANT_URL');
    this.apiKey = config.get<string>('QDRANT_API_KEY');
    this.textCollection = config.get<string>('QDRANT_TEXT_COLLECTION') ?? 'text_collection_cloud';
    this.imageCollection =
      config.get<string>('QDRANT_IMAGE_COLLECTION') ?? 'image_collection_cloud';
    this.textModel = config.get<string>('QDRANT_TEXT_MODEL') ?? 'intfloat/multilingual-e5-small';
    this.imageModel = config.get<string>('QDRANT_IMAGE_MODEL') ?? 'qdrant/clip-vit-b-32-vision';
    this.imageTextModel =
      config.get<string>('QDRANT_IMAGE_TEXT_MODEL') ?? 'qdrant/clip-vit-b-32-text';
    this.client = new QdrantClient({
      url: this.url ?? 'http://127.0.0.1:6333',
      apiKey: this.apiKey,
      timeout: 60_000,
      checkCompatibility: false,
    });
  }

  assertConfigured(): void {
    const missing = [
      !this.url ? 'QDRANT_URL' : null,
      !this.apiKey ? 'QDRANT_API_KEY' : null,
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new ServiceUnavailableException(`AI configuration is missing: ${missing.join(', ')}`);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.apiKey);
  }

  async getHealth(): Promise<QdrantCollectionHealth[]> {
    this.assertConfigured();
    return Promise.all(
      [this.textCollection, this.imageCollection].map(async (collection) => {
        const info = await this.client.getCollection(collection);
        return {
          collection,
          status: info.status,
          pointsCount: info.points_count ?? null,
        };
      }),
    );
  }
}

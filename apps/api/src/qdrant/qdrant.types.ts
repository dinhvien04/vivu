import type { Schemas } from '@qdrant/js-client-rest';

export type QdrantFilter = Schemas['Filter'];

export interface QdrantTextPayload {
  place_slug?: string;
  location_key?: string;
  location_name?: string;
  province?: string;
  doc_type?: string;
  chunk_index?: number;
  text?: string;
  s3_key?: string;
  source_file?: string;
}

export interface QdrantImagePayload {
  place_slug?: string;
  location_key?: string;
  location_name?: string;
  province?: string;
  s3_key?: string;
  filename?: string;
  source?: string;
}

export interface QdrantTextResult extends QdrantTextPayload {
  id: string | number;
  score: number;
}

export interface QdrantImageResult extends QdrantImagePayload {
  id: string | number;
  score: number;
}

export interface QdrantCollectionHealth {
  collection: string;
  status: string;
  pointsCount: number | null;
}

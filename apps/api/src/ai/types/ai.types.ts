import type { QdrantImageResult, QdrantTextResult } from '../../qdrant/qdrant.types';

export type AiInputType = 'text_only' | 'image_only' | 'image_text';

export interface AiUploadedImage {
  buffer: Buffer;
  contentType: string;
  filename?: string;
}

export interface AiPlaceResult {
  slug?: string;
  name?: string;
  province?: string;
  score?: number;
  thumbnail_url?: string;
}

export interface AiSource {
  type: 'text' | 'image' | 'place';
  title?: string;
  source_file?: string;
  s3_key?: string;
  url?: string;
  score?: number;
}

export interface AiMatchedImage {
  location_name?: string;
  place_slug?: string;
  s3_key?: string;
  image_url?: string;
  score?: number;
}

export interface AiChatResponse {
  success: boolean;
  input_type: AiInputType;
  answer: string;
  places?: AiPlaceResult[];
  sources?: AiSource[];
  matched_images?: AiMatchedImage[];
  debug?: {
    textResults?: number;
    imageResults?: number;
    detectedPlaceSlug?: string;
    qdrantTextModel?: string;
    qdrantImageModel?: string;
    geminiModel?: string;
  };
}

export interface AiPipelineInput {
  message?: string;
  sessionId?: string;
  image?: AiUploadedImage;
}

export interface AiRetrievalBundle {
  textResults?: QdrantTextResult[];
  imageResults?: QdrantImageResult[];
  answer: string;
  inputType: AiInputType;
  detectedPlaceSlug?: string;
}

export type AiInputType = 'text_only' | 'image_only' | 'image_text';

export interface AiChatResponse {
  success: boolean;
  input_type: AiInputType;
  answer: string;
  places?: Array<{
    slug?: string;
    name?: string;
    province?: string;
    score?: number;
    thumbnail_url?: string;
  }>;
  sources?: Array<{
    type: 'text' | 'image' | 'place';
    title?: string;
    source_file?: string;
    s3_key?: string;
    url?: string;
    score?: number;
  }>;
  matched_images?: Array<{
    location_name?: string;
    place_slug?: string;
    s3_key?: string;
    image_url?: string;
    score?: number;
  }>;
  debug?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreviewUrl?: string;
  response?: AiChatResponse;
  createdAt: string;
  error?: boolean;
}

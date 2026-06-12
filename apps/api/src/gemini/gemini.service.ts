import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface GenerateTravelAnswerParams {
  question: string;
  context: string;
  detectedPlace?: {
    slug?: string;
    name?: string;
    score?: number;
  };
  matchedImages?: Array<{
    location_name?: string;
    s3_key?: string;
    score?: number;
  }>;
}

@Injectable()
export class GeminiService {
  readonly model: string;
  private readonly apiKey?: string;
  private readonly client: GoogleGenAI | null;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY');
    this.model = config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.client = this.apiKey ? new GoogleGenAI({ apiKey: this.apiKey }) : null;
  }

  assertConfigured(): void {
    if (!this.client) {
      throw new ServiceUnavailableException('AI configuration is missing: GEMINI_API_KEY');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async generateTravelAnswer(params: GenerateTravelAnswerParams): Promise<string> {
    this.assertConfigured();
    const response = await this.client!.models.generateContent({
      model: this.model,
      contents: buildPrompt(params),
      config: {
        temperature: 0.2,
      },
    });
    const text = response.text?.trim();
    if (!text) {
      throw new ServiceUnavailableException('Gemini did not return an answer.');
    }
    return text;
  }

  async checkHealth(): Promise<{ status: 'ok'; model: string }> {
    this.assertConfigured();
    await this.client!.models.generateContent({
      model: this.model,
      contents: 'Trả lời đúng một từ: OK',
      config: { maxOutputTokens: 8, temperature: 0 },
    });
    return { status: 'ok', model: this.model };
  }
}

function buildPrompt(params: GenerateTravelAnswerParams): string {
  return [
    'Bạn là trợ lý du lịch Việt Nam.',
    'Trả lời bằng tiếng Việt, tự nhiên và dễ hiểu.',
    'Chỉ sử dụng dữ liệu trong phần CONTEXT. Không sử dụng kiến thức bên ngoài.',
    'Nếu context không đủ, hãy nói rõ hệ thống chưa có đủ dữ liệu.',
    'Không bịa giá vé, giờ mở cửa, địa chỉ hoặc thông tin thực tế không có trong context.',
    'Nếu có kết quả nhận diện ảnh, hãy mô tả mức độ chắc chắn dựa trên score.',
    '',
    `CÂU HỎI: ${params.question}`,
    `ĐỊA ĐIỂM NHẬN DIỆN: ${JSON.stringify(params.detectedPlace ?? null)}`,
    `ẢNH KHỚP: ${JSON.stringify(params.matchedImages ?? [])}`,
    '',
    `CONTEXT:\n${params.context || '(không có dữ liệu)'}`,
  ].join('\n');
}

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

const MAX_GENERATION_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 750;

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

interface GenerateTextOptions {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseJsonSchema?: unknown;
}

@Injectable()
export class GeminiService {
  readonly model: string;
  private readonly apiKey?: string;
  private readonly client: GoogleGenAI | null;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY');
    this.model = config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';
    this.timeoutMs = positiveInteger(config.get<string>('GEMINI_TIMEOUT_MS'), 30_000);
    this.maxOutputTokens = positiveInteger(config.get<string>('GEMINI_MAX_OUTPUT_TOKENS'), 1024);
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
    return this.generateText(buildPrompt(params), {
      temperature: 0.2,
      maxOutputTokens: this.maxOutputTokens,
    });
  }

  async generateText(prompt: string, options: GenerateTextOptions = {}): Promise<string> {
    this.assertConfigured();

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        const response = await withTimeout(
          this.client!.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
              temperature: options.temperature ?? 0.2,
              maxOutputTokens: options.maxOutputTokens ?? this.maxOutputTokens,
              ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
              ...(options.responseJsonSchema
                ? { responseJsonSchema: options.responseJsonSchema }
                : {}),
            },
          }),
          this.timeoutMs,
          'Gemini request timed out.',
        );
        const text = response.text?.trim();
        if (!text) {
          throw new ServiceUnavailableException('Gemini did not return an answer.');
        }
        return text;
      } catch (error) {
        if (!isTransientGeminiError(error) || attempt === MAX_GENERATION_ATTEMPTS) {
          throw new ServiceUnavailableException(
            'Gemini is temporarily unavailable. Please try again.',
          );
        }
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }

    throw new ServiceUnavailableException('Gemini is temporarily unavailable. Please try again.');
  }

  async checkHealth(): Promise<{ status: 'ok'; model: string }> {
    this.assertConfigured();
    await withTimeout(
      this.client!.models.generateContent({
        model: this.model,
        contents: 'Trả lời đúng một từ: OK',
        config: { maxOutputTokens: 8, temperature: 0 },
      }),
      this.timeoutMs,
      'Gemini health check timed out.',
    );
    return { status: 'ok', model: this.model };
  }
}

function isTransientGeminiError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = Number(
    (error as Error & { status?: number; code?: number }).status ??
      (error as Error & { status?: number; code?: number }).code,
  );
  return (
    status === 429 ||
    status >= 500 ||
    /429|5\d\d|resource[_ ]?exhausted|unavailable|high demand|timeout/i.test(error.message)
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function buildPrompt(params: GenerateTravelAnswerParams): string {
  return [
    'Bạn là trợ lý du lịch của Vivu.',
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

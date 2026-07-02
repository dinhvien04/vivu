import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ConduitErrorReason =
  | 'invalid_config'
  | 'credit_exhausted'
  | 'blocked'
  | 'rate_limited'
  | 'timeout'
  | 'unknown';

interface ConduitErrorDefinition {
  reason: ConduitErrorReason;
  message: string;
  httpStatus: HttpStatus;
}

interface ConduitGenerateTextOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

type ConduitChatRole = 'system' | 'user' | 'assistant';

interface ConduitChatMessage {
  role: ConduitChatRole;
  content: string;
}

interface ConduitRequestBody {
  model: string;
  messages: ConduitChatMessage[];
  temperature: number;
  max_tokens: number;
}

const DEFAULT_BASE_URL = 'https://conduit.ozdoev.net/api/v1';
const DEFAULT_MODEL = 'gpt-5';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

const ERROR_BY_STATUS = new Map<number, ConduitErrorDefinition>([
  [
    401,
    {
      reason: 'invalid_config',
      message: 'Cấu hình AI chưa hợp lệ.',
      httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    },
  ],
  [
    402,
    {
      reason: 'credit_exhausted',
      message: 'Tài khoản AI đã hết credit.',
      httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    },
  ],
  [
    403,
    {
      reason: 'blocked',
      message: 'Nhà cung cấp AI đang chặn request.',
      httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    },
  ],
  [
    429,
    {
      reason: 'rate_limited',
      message: 'Hệ thống AI đang quá tải, vui lòng thử lại sau.',
      httpStatus: HttpStatus.TOO_MANY_REQUESTS,
    },
  ],
]);

const TIMEOUT_ERROR: ConduitErrorDefinition = {
  reason: 'timeout',
  message: 'AI phản hồi quá lâu, vui lòng thử lại.',
  httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
};

const UNKNOWN_ERROR: ConduitErrorDefinition = {
  reason: 'unknown',
  message: 'AI đang tạm thời gặp sự cố.',
  httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
};

@Injectable()
export class ConduitAiService {
  readonly baseUrl: string;
  readonly defaultModel: string;
  readonly tripPlannerModel: string;
  readonly chatModel: string;
  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.enabled = config.get<string>('CONDUIT_ENABLED') === 'true';
    this.apiKey = config.get<string>('CONDUIT_API_KEY')?.trim() || undefined;
    this.baseUrl = trimTrailingSlash(
      config.get<string>('CONDUIT_BASE_URL')?.trim() || DEFAULT_BASE_URL,
    );
    this.defaultModel = config.get<string>('CONDUIT_DEFAULT_MODEL')?.trim() || DEFAULT_MODEL;
    this.tripPlannerModel =
      config.get<string>('CONDUIT_TRIP_PLANNER_MODEL')?.trim() || this.defaultModel;
    this.chatModel = config.get<string>('CONDUIT_CHAT_MODEL')?.trim() || this.defaultModel;
    this.timeoutMs = positiveInteger(config.get<string>('CONDUIT_TIMEOUT_MS'), DEFAULT_TIMEOUT_MS);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isConfigured(): boolean {
    return this.enabled && Boolean(this.apiKey);
  }

  async generateText(prompt: string, options: ConduitGenerateTextOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new ConduitAiException(ERROR_BY_STATUS.get(401)!, 401);
    }

    const body: ConduitRequestBody = {
      model: options.model ?? this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    };

    const response = await this.postChatCompletion(body);
    const content = extractAssistantText(response)?.trim();
    if (!content) throw new ConduitAiException(UNKNOWN_ERROR);
    return content;
  }

  private async postChatCompletion(body: ConduitRequestBody): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ConduitAiException(definitionForStatus(response.status), response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ConduitAiException) throw error;
      if (isAbortError(error)) throw new ConduitAiException(TIMEOUT_ERROR);
      throw new ConduitAiException(UNKNOWN_ERROR);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class ConduitAiException extends HttpException {
  readonly reason: ConduitErrorReason;
  readonly providerStatus?: number;

  constructor(definition: ConduitErrorDefinition, providerStatus?: number) {
    super(definition.message, definition.httpStatus);
    this.reason = definition.reason;
    this.providerStatus = providerStatus;
  }
}

function definitionForStatus(status: number): ConduitErrorDefinition {
  return ERROR_BY_STATUS.get(status) ?? UNKNOWN_ERROR;
}

function extractAssistantText(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return null;

  for (const choice of payload.choices) {
    if (!isRecord(choice)) continue;
    const message = choice.message;
    if (isRecord(message)) {
      const content = stringifyContent(message.content);
      if (content) return content;
    }
    const text = stringifyContent(choice.text);
    if (text) return text;
  }

  return null;
}

function stringifyContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (isRecord(part) && typeof part.text === 'string') return part.text;
      return '';
    })
    .join('')
    .trim();
  return text || null;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || /abort|timeout|timed out/i.test(error.message))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

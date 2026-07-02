import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  GeminiService,
  buildTravelAnswerPrompt,
  type GenerateTextOptions,
  type GenerateTravelAnswerParams,
} from '../gemini/gemini.service';
import { ConduitAiException, ConduitAiService } from './conduit-ai.service';

type TextGenerationPurpose = 'trip_planner' | 'ai_chat_text';

interface GenerateWithFallbackOptions<T> {
  purpose: TextGenerationPurpose;
  prompt: string;
  conduitModel: string;
  conduitOptions: GenerateTextOptions;
  geminiCall: () => Promise<string>;
  transform: (raw: string) => T;
}

const GENERIC_AI_ERROR = 'AI đang tạm thời gặp sự cố.';

@Injectable()
export class AiTextGenerationService {
  private readonly logger = new Logger(AiTextGenerationService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly conduit: ConduitAiService,
  ) {}

  async generateTripPlan<T>(
    prompt: string,
    options: GenerateTextOptions,
    transform: (raw: string) => T,
  ): Promise<T> {
    return this.generateWithFallback({
      purpose: 'trip_planner',
      prompt,
      conduitModel: this.conduit.tripPlannerModel,
      conduitOptions: options,
      geminiCall: () => this.gemini.generateText(prompt, options),
      transform,
    });
  }

  async generateTravelAnswer(params: GenerateTravelAnswerParams): Promise<string> {
    const prompt = buildTravelAnswerPrompt(params);
    return this.generateWithFallback({
      purpose: 'ai_chat_text',
      prompt,
      conduitModel: this.conduit.chatModel,
      conduitOptions: {
        temperature: 0.2,
      },
      geminiCall: () => this.gemini.generateTravelAnswer(params),
      transform: (raw) => raw,
    });
  }

  private async generateWithFallback<T>(options: GenerateWithFallbackOptions<T>): Promise<T> {
    if (!this.conduit.isEnabled()) {
      return this.callGemini(options.purpose, options.geminiCall, options.transform);
    }

    try {
      const raw = await this.conduit.generateText(options.prompt, {
        ...options.conduitOptions,
        model: options.conduitModel,
      });
      return options.transform(raw);
    } catch (conduitError) {
      this.logProviderFailure('conduit', options.purpose, conduitError, {
        model: options.conduitModel,
        fallback: this.gemini.isConfigured() ? 'gemini' : 'none',
      });

      if (!this.gemini.isConfigured()) throw normalizeAiError(conduitError);

      try {
        const raw = await options.geminiCall();
        return options.transform(raw);
      } catch (geminiError) {
        this.logProviderFailure('gemini', options.purpose, geminiError, {
          fallback: 'none',
        });
        throw selectFinalError(conduitError, geminiError);
      }
    }
  }

  private async callGemini<T>(
    purpose: TextGenerationPurpose,
    geminiCall: () => Promise<string>,
    transform: (raw: string) => T,
  ): Promise<T> {
    try {
      return transform(await geminiCall());
    } catch (error) {
      this.logProviderFailure('gemini', purpose, error, { fallback: 'none' });
      throw normalizeAiError(error);
    }
  }

  private logProviderFailure(
    provider: 'conduit' | 'gemini',
    purpose: TextGenerationPurpose,
    error: unknown,
    extra: Record<string, string>,
  ): void {
    this.logger.warn(
      JSON.stringify({
        provider,
        purpose,
        ...extra,
        status: error instanceof ConduitAiException ? error.providerStatus : undefined,
        reason: error instanceof ConduitAiException ? error.reason : undefined,
      }),
    );
  }
}

function normalizeAiError(error: unknown): Error {
  if (error instanceof ConduitAiException) return error;
  if (error instanceof HttpException) return error;
  return new ServiceUnavailableException(GENERIC_AI_ERROR);
}

function selectFinalError(conduitError: unknown, geminiError: unknown): Error {
  if (geminiError instanceof HttpException && geminiError.getStatus() === HttpStatus.BAD_GATEWAY) {
    return geminiError;
  }
  if (conduitError instanceof ConduitAiException) return conduitError;
  return normalizeAiError(geminiError);
}

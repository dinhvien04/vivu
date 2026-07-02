import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  GeminiService,
  buildTravelAnswerPrompt,
  type GenerateTextOptions,
  type GenerateTravelAnswerParams,
} from '../gemini/gemini.service';
import { ConduitAiException, ConduitAiService } from './conduit-ai.service';

type TextGenerationPurpose = 'trip_planner' | 'ai_chat_text';

interface GenerateWithFallbackOptions {
  purpose: TextGenerationPurpose;
  prompt: string;
  conduitModel: string;
  conduitOptions: GenerateTextOptions;
  geminiCall: () => Promise<string>;
}

const GENERIC_AI_ERROR = 'AI đang tạm thời gặp sự cố.';

@Injectable()
export class AiTextGenerationService {
  private readonly logger = new Logger(AiTextGenerationService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly conduit: ConduitAiService,
  ) {}

  async generateTripPlan(prompt: string, options: GenerateTextOptions = {}): Promise<string> {
    return this.generateWithFallback({
      purpose: 'trip_planner',
      prompt,
      conduitModel: this.conduit.tripPlannerModel,
      conduitOptions: options,
      geminiCall: () => this.gemini.generateText(prompt, options),
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
    });
  }

  private async generateWithFallback(options: GenerateWithFallbackOptions): Promise<string> {
    if (!this.conduit.isEnabled()) {
      return this.callGemini(options.purpose, options.geminiCall);
    }

    try {
      return await this.conduit.generateText(options.prompt, {
        ...options.conduitOptions,
        model: options.conduitModel,
      });
    } catch (conduitError) {
      this.logProviderFailure('conduit', options.purpose, conduitError, {
        model: options.conduitModel,
        fallback: this.gemini.isConfigured() ? 'gemini' : 'none',
      });

      if (!this.gemini.isConfigured()) throw normalizeAiError(conduitError);

      try {
        return await options.geminiCall();
      } catch (geminiError) {
        this.logProviderFailure('gemini', options.purpose, geminiError, {
          fallback: 'none',
        });
        throw normalizeAiError(conduitError);
      }
    }
  }

  private async callGemini(
    purpose: TextGenerationPurpose,
    geminiCall: () => Promise<string>,
  ): Promise<string> {
    try {
      return await geminiCall();
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
  return new ServiceUnavailableException(GENERIC_AI_ERROR);
}

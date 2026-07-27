import { BadGatewayException, HttpStatus } from '@nestjs/common';
import type { GeminiService } from '../gemini/gemini.service';
import { AiTextGenerationService } from './ai-text-generation.service';
import { ConduitAiException, type ConduitAiService } from './conduit-ai.service';

describe('AiTextGenerationService', () => {
  it('uses Conduit for Trip Planner when the feature flag is enabled', async () => {
    const { service, conduit, gemini } = makeService();
    conduit.generateText.mockResolvedValue('{"title":"Plan","days":[]}');

    await expect(
      service.generateTripPlan(
        'planner prompt',
        {
          temperature: 0.15,
          maxOutputTokens: 3200,
          responseMimeType: 'application/json',
        },
        (raw) => raw,
      ),
    ).resolves.toBe('{"title":"Plan","days":[]}');

    expect(conduit.generateText).toHaveBeenCalledWith(
      'planner prompt',
      expect.objectContaining({
        model: 'anthropic/claude-sonnet-4-6',
        temperature: 0.15,
        maxOutputTokens: 3200,
      }),
    );
    expect(gemini.generateText).not.toHaveBeenCalled();
  });

  it('falls back to Gemini when Conduit returns a credit error', async () => {
    const { service, conduit, gemini } = makeService();
    conduit.generateText.mockRejectedValue(conduitError(402, 'Tài khoản AI đã hết credit.'));
    gemini.generateText.mockResolvedValue('gemini plan');

    await expect(service.generateTripPlan('planner prompt', {}, (raw) => raw)).resolves.toBe(
      'gemini plan',
    );

    expect(gemini.generateText).toHaveBeenCalledWith('planner prompt', {});
  });

  it('returns a friendly Conduit error when no Gemini fallback is configured', async () => {
    const { service, conduit, gemini } = makeService({ geminiConfigured: false });
    conduit.generateText.mockRejectedValue(conduitError(402, 'Tài khoản AI đã hết credit.'));

    await expect(service.generateTripPlan('planner prompt', {}, (raw) => raw)).rejects.toThrow(
      'Tài khoản AI đã hết credit.',
    );

    expect(gemini.generateText).not.toHaveBeenCalled();
  });

  it('falls back to Gemini when Conduit returns invalid structured output', async () => {
    const { service, conduit, gemini } = makeService();
    conduit.generateText.mockResolvedValue('not-json');
    gemini.generateText.mockResolvedValue('{"title":"Gemini plan"}');
    const parse = jest.fn((raw: string) => {
      try {
        return JSON.parse(raw) as { title: string };
      } catch {
        throw new BadGatewayException('AI output is not valid JSON.');
      }
    });

    await expect(service.generateTripPlan('planner prompt', {}, parse)).resolves.toEqual({
      title: 'Gemini plan',
    });

    expect(parse).toHaveBeenCalledTimes(2);
    expect(gemini.generateText).toHaveBeenCalledWith('planner prompt', {});
  });

  it('retries Gemini once when its Trip Planner output is invalid', async () => {
    const { service, conduit, gemini } = makeService();
    conduit.generateText.mockRejectedValue(conduitError(402, 'AI credit exhausted.'));
    gemini.generateText
      .mockResolvedValueOnce('{"days":[]}')
      .mockResolvedValueOnce('{"days":[{"items":[{"placeName":"Bien Ho"}]}]}');
    const parse = jest.fn((raw: string) => {
      const parsed = JSON.parse(raw) as { days?: Array<{ items?: unknown[] }> };
      if (!parsed.days?.[0]?.items?.length) {
        throw new BadGatewayException('AI did not return a usable itinerary.');
      }
      return parsed;
    });

    await expect(service.generateTripPlan('planner prompt', {}, parse)).resolves.toEqual({
      days: [{ items: [{ placeName: 'Bien Ho' }] }],
    });

    expect(gemini.generateText).toHaveBeenCalledTimes(2);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('uses Conduit for AI Chat text-only generation when enabled', async () => {
    const { service, conduit, gemini } = makeService();
    conduit.generateText.mockResolvedValue('Câu trả lời từ Conduit');

    await expect(
      service.generateTravelAnswer({
        question: 'Biển Hồ có gì đẹp?',
        context: 'Biển Hồ là thắng cảnh tại Gia Lai.',
      }),
    ).resolves.toBe('Câu trả lời từ Conduit');

    expect(conduit.generateText).toHaveBeenCalledWith(
      expect.stringContaining('Biển Hồ có gì đẹp?'),
      expect.objectContaining({ model: 'openai/gpt-5-mini' }),
    );
    expect(gemini.generateTravelAnswer).not.toHaveBeenCalled();
  });
});

function makeService(options: { conduitEnabled?: boolean; geminiConfigured?: boolean } = {}) {
  const conduit = {
    tripPlannerModel: 'anthropic/claude-sonnet-4-6',
    chatModel: 'openai/gpt-5-mini',
    isEnabled: jest.fn().mockReturnValue(options.conduitEnabled ?? true),
    generateText: jest.fn(),
  };
  const gemini = {
    isConfigured: jest.fn().mockReturnValue(options.geminiConfigured ?? true),
    generateText: jest.fn(),
    generateTravelAnswer: jest.fn(),
  };

  return {
    conduit,
    gemini,
    service: new AiTextGenerationService(
      gemini as unknown as GeminiService,
      conduit as unknown as ConduitAiService,
    ),
  };
}

function conduitError(status: number, message: string): ConduitAiException {
  return new ConduitAiException(
    {
      reason: status === 402 ? 'credit_exhausted' : 'unknown',
      message,
      httpStatus: status === 429 ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.SERVICE_UNAVAILABLE,
    },
    status,
  );
}

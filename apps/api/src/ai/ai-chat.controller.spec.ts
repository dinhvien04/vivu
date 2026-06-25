import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

describe('AiChatController production hardening', () => {
  const originalAiFeatureEnabled = process.env.AI_FEATURE_ENABLED;

  afterEach(() => {
    if (originalAiFeatureEnabled === undefined) {
      delete process.env.AI_FEATURE_ENABLED;
    } else {
      process.env.AI_FEATURE_ENABLED = originalAiFeatureEnabled;
    }
  });

  it('returns 503 when the AI kill switch is disabled', () => {
    process.env.AI_FEATURE_ENABLED = 'false';
    const controller = createController({ NODE_ENV: 'production' });

    expect(() =>
      controller.chatRequest({} as never, { message: 'Bien Ho co gi dep?' }),
    ).toThrow(ServiceUnavailableException);
  });

  it('returns only a simple public health payload in production', () => {
    const controller = createController({
      NODE_ENV: 'production',
      AI_DEEP_HEALTH_ENABLED: 'false',
    });

    expect(controller.health()).toEqual({
      status: 'ok',
      service: 'vivu-ai',
    });
  });

  it('hides deep health endpoints in production by default', async () => {
    const controller = createController({
      NODE_ENV: 'production',
      AI_DEEP_HEALTH_ENABLED: 'false',
    });

    await expect(controller.qdrantHealth()).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.geminiHealth()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides debug search endpoints in production', () => {
    const controller = createController({
      NODE_ENV: 'production',
      AI_DEEP_HEALTH_ENABLED: 'false',
    });

    expect(() => controller.searchText({ message: 'Biển Hồ' })).toThrow(NotFoundException);
    expect(() => controller.searchImageByText({ message: 'Biển Hồ' })).toThrow(NotFoundException);
    expect(() => controller.searchImageByUrl({ imageUrl: 'https://example.com/a.jpg' })).toThrow(
      NotFoundException,
    );
  });
});

function createController(env: Record<string, string | undefined>): AiChatController {
  return new AiChatController(
    config(env) as never,
    {} as never,
    {
      isConfigured: jest.fn().mockReturnValue(true),
      getHealth: jest.fn().mockResolvedValue([]),
    } as never,
    {
      searchTextByMessage: jest.fn(),
      searchImagesByText: jest.fn(),
      searchImagesByImageUrl: jest.fn(),
    } as never,
    {
      isConfigured: jest.fn().mockReturnValue(true),
      model: 'gemini-test',
      checkHealth: jest.fn().mockResolvedValue({ status: 'ok', model: 'gemini-test' }),
    } as never,
  );
}

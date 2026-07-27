import type { ConfigService } from '@nestjs/config';
import { ConduitAiService } from './conduit-ai.service';

describe('ConduitAiService', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls the OpenAI-compatible chat completions endpoint', async () => {
    fetchSpy.mockResolvedValue(
      response(200, {
        choices: [{ message: { content: 'Xin chào từ Conduit' } }],
      }),
    );
    const service = makeService();

    await expect(
      service.generateText('Tạo lịch trình', {
        model: 'openai/gpt-5-mini',
        temperature: 0.1,
        maxOutputTokens: 128,
      }),
    ).resolves.toBe('Xin chào từ Conduit');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://conduit.ozdoev.net/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer test-conduit-key',
          'content-type': 'application/json',
        }),
      }),
    );
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'openai/gpt-5-mini',
      messages: [{ role: 'user', content: 'Tạo lịch trình' }],
      temperature: 0.1,
      max_tokens: 128,
    });
  });

  it.each([
    [401, 'Cấu hình AI chưa hợp lệ.'],
    [402, 'Tài khoản AI đã hết credit.'],
    [403, 'Nhà cung cấp AI đang chặn request.'],
    [429, 'Hệ thống AI đang quá tải, vui lòng thử lại sau.'],
  ])('maps upstream %s to a friendly error', async (status, message) => {
    fetchSpy.mockResolvedValue(response(status, { error: 'upstream error' }));
    const service = makeService();

    await expect(service.generateText('prompt')).rejects.toThrow(message);
  });
});

function makeService(values: Record<string, string> = {}): ConduitAiService {
  return new ConduitAiService(
    config({
      CONDUIT_ENABLED: 'true',
      CONDUIT_API_KEY: 'test-conduit-key',
      CONDUIT_BASE_URL: 'https://conduit.ozdoev.net/api/v1',
      CONDUIT_DEFAULT_MODEL: 'openai/gpt-5-mini',
      CONDUIT_TRIP_PLANNER_MODEL: 'anthropic/claude-sonnet-4-6',
      CONDUIT_CHAT_MODEL: 'openai/gpt-5-mini',
      CONDUIT_TIMEOUT_MS: '30000',
      ...values,
    }),
  );
}

function config(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

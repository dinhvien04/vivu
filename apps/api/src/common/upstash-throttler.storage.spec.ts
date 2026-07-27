import { UpstashThrottlerStorage } from './upstash-throttler.storage';

describe('UpstashThrottlerStorage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      JEST_WORKER_ID: undefined,
    };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('blocks requests in production when Upstash is unavailable', async () => {
    const storage = new UpstashThrottlerStorage();
    const result = await storage.increment('203.0.113.1', 60_000, 10, 0, 'default');
    expect(result.isBlocked).toBe(true);
    expect(result.totalHits).toBeGreaterThan(10);
  });

  it('uses in-memory fallback in development', async () => {
    process.env.NODE_ENV = 'development';
    const storage = new UpstashThrottlerStorage();
    const result = await storage.increment('127.0.0.1', 60_000, 10, 0, 'default');
    expect(result.isBlocked).toBe(false);
    expect(result.totalHits).toBe(1);
  });

  it('sends EVAL using the Upstash REST command-array format', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: [1, 60] }),
    } as Response);

    const storage = new UpstashThrottlerStorage();
    const result = await storage.increment('203.0.113.2', 60_000, 10, 0, 'default');

    expect(result).toMatchObject({
      totalHits: 1,
      timeToExpire: 60_000,
      isBlocked: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://example.upstash.io');
    const command = JSON.parse(String(init?.body)) as unknown[];
    expect(command[0]).toBe('EVAL');
    expect(command[2]).toBe(1);
    expect(command.slice(3)).toEqual(['throttle:default:203.0.113.2', '10', '60']);

    fetchMock.mockRestore();
  });
});

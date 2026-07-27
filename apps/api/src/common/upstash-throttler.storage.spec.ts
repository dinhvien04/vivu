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
});

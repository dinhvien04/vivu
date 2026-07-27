import { InMemoryRateLimiterStore, UpstashRedisRateLimiterStore } from './rate-limiter.store';

describe('UpstashRedisRateLimiterStore', () => {
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

  it('blocks requests in production when Upstash is not configured', async () => {
    const store = new UpstashRedisRateLimiterStore();
    await expect(store.incrementAndCheck('auth:login', 5, 60)).resolves.toBe(false);
  });

  it('falls open in development when Upstash is not configured', async () => {
    process.env.NODE_ENV = 'development';
    const store = new UpstashRedisRateLimiterStore();
    await expect(store.incrementAndCheck('auth:login', 5, 60)).resolves.toBe(true);
  });
});

describe('InMemoryRateLimiterStore', () => {
  it('tracks counts within the configured window', async () => {
    const store = new InMemoryRateLimiterStore();
    await expect(store.incrementAndCheck('leads:ip', 2, 60)).resolves.toBe(true);
    await expect(store.incrementAndCheck('leads:ip', 2, 60)).resolves.toBe(true);
    await expect(store.incrementAndCheck('leads:ip', 2, 60)).resolves.toBe(false);
    await expect(store.peek('leads:ip')).resolves.toBe(3);
  });
});

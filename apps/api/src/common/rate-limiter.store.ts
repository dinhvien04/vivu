import { Injectable, Logger } from '@nestjs/common';
import { fetchJson } from './fetch-json';
import {
  hasUpstashRedisConfig,
  isProductionEnv,
  isTestEnv,
  shouldFailClosedOnRedisErrors,
} from './upstash-env';

export const RATE_LIMITER_STORE = Symbol('RATE_LIMITER_STORE');

export interface RateLimiterStore {
  incrementAndCheck(key: string, limit: number, windowSeconds: number): Promise<boolean>;
  peek(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

@Injectable()
export class InMemoryRateLimiterStore implements RateLimiterStore {
  private readonly records = new Map<string, { count: number; resetAt: number }>();

  async incrementAndCheck(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const record = this.records.get(key);

    if (!record || now >= record.resetAt) {
      this.records.set(key, { count: 1, resetAt: now + windowSeconds });
      return true;
    }

    record.count += 1;
    return record.count <= limit;
  }

  async peek(key: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const record = this.records.get(key);
    if (!record || now >= record.resetAt) return 0;
    return record.count;
  }

  async reset(key: string): Promise<void> {
    this.records.delete(key);
  }
}

@Injectable()
export class UpstashRedisRateLimiterStore implements RateLimiterStore {
  private readonly logger = new Logger(UpstashRedisRateLimiterStore.name);
  private readonly url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  private readonly token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  async incrementAndCheck(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const failClosed = shouldFailClosedOnRedisErrors();
    if (!this.url || !this.token) {
      return failClosed ? false : true;
    }

    try {
      const luaScript = `
        local current = redis.call('incr', KEYS[1])
        if current == 1 then
          redis.call('expire', KEYS[1], tonumber(ARGV[2]))
        end
        return current <= tonumber(ARGV[1]) and 1 or 0
      `;

      const response = await fetchJson(`${this.url}/eval`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: luaScript,
          keys: [key],
          args: [String(limit), String(windowSeconds)],
        }),
      });

      if (!response.ok) {
        throw new Error(`Upstash HTTP Error: ${response.status} ${response.statusText}`);
      }

      const resJson = (await response.json()) as { result?: number | null };
      return resJson.result === 1;
    } catch (err) {
      this.logger.error(
        `Upstash rate limiting failed: ${err instanceof Error ? err.message : err}. ${
          failClosed ? 'Blocking request.' : 'Allowing request in non-production.'
        }`,
      );
      return !failClosed;
    }
  }

  async peek(key: string): Promise<number> {
    if (!this.url || !this.token) return 0;
    try {
      const response = await fetchJson(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!response.ok) return 0;
      const json = (await response.json()) as { result?: string | null };
      const value = Number(json.result ?? 0);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return shouldFailClosedOnRedisErrors() ? Number.MAX_SAFE_INTEGER : 0;
    }
  }

  async reset(key: string): Promise<void> {
    if (!this.url || !this.token) return;
    try {
      await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch {
      // ignore
    }
  }
}

export function createRateLimiterStore(
  upstash: UpstashRedisRateLimiterStore,
  memory: InMemoryRateLimiterStore,
): RateLimiterStore {
  if (hasUpstashRedisConfig()) {
    return upstash;
  }
  if (isProductionEnv() && !isTestEnv()) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for rate limiting.',
    );
  }
  return memory;
}

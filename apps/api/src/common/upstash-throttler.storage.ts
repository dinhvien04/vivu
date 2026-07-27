import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { fetchJson } from './fetch-json';
import {
  hasUpstashRedisConfig,
  isProductionEnv,
  isTestEnv,
  shouldFailClosedOnRedisErrors,
} from './upstash-env';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class UpstashThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(UpstashThrottlerStorage.name);
  private readonly url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  private readonly token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  private readonly fallback = new Map<string, { totalHits: number; expiresAt: number }>();
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const storageKey = `throttle:${throttlerName}:${key}`;
    const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000));
    const failClosed = shouldFailClosedOnRedisErrors();
    const useMemory = !hasUpstashRedisConfig() && !failClosed;

    if (useMemory) {
      return this.incrementInMemory(storageKey, ttl, limit, blockDuration);
    }

    try {
      const luaScript = `
        local current = redis.call('incr', KEYS[1])
        if current == 1 then
          redis.call('expire', KEYS[1], tonumber(ARGV[2]))
        end
        local ttlLeft = redis.call('ttl', KEYS[1])
        return {current, ttlLeft}
      `;
      const response = await fetchJson(`${this.url}/eval`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: luaScript,
          keys: [storageKey],
          args: [String(limit), String(ttlSeconds)],
        }),
        timeoutMs: 5_000,
      });
      if (!response.ok) {
        throw new Error(`Upstash throttler HTTP ${response.status}`);
      }
      const json = (await response.json()) as { result?: [number, number] | null };
      const totalHits = json.result?.[0] ?? 1;
      const timeToExpire = Math.max(0, (json.result?.[1] ?? ttlSeconds) * 1000);
      const isBlocked = totalHits > limit;
      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: isBlocked ? blockDuration : 0,
      };
    } catch (err) {
      this.logger.error(
        `Upstash throttler failed: ${err instanceof Error ? err.message : err}. ${
          failClosed ? 'Blocking request.' : 'Falling back to memory.'
        }`,
      );
      if (failClosed) {
        return {
          totalHits: limit + 1,
          timeToExpire: ttl,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        };
      }
      return this.incrementInMemory(storageKey, ttl, limit, blockDuration);
    }
  }

  private incrementInMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const current = this.fallback.get(key);
    const record =
      current && current.expiresAt > now
        ? { totalHits: current.totalHits + 1, expiresAt: current.expiresAt }
        : { totalHits: 1, expiresAt: now + ttl };
    this.fallback.set(key, record);
    const isBlocked = record.totalHits > limit;
    return {
      totalHits: record.totalHits,
      timeToExpire: Math.max(0, record.expiresAt - now),
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }
}

export function assertThrottlerStorageReady(): void {
  if (hasUpstashRedisConfig() || !isProductionEnv() || isTestEnv()) {
    return;
  }
  throw new Error(
    'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for request throttling.',
  );
}

import { Injectable, Logger } from '@nestjs/common';

export interface RateLimiterStore {
  incrementAndCheck(key: string, limit: number, windowSeconds: number): Promise<boolean>;
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
}

@Injectable()
export class UpstashRedisRateLimiterStore implements RateLimiterStore {
  private readonly logger = new Logger(UpstashRedisRateLimiterStore.name);
  private readonly url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  private readonly token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  async incrementAndCheck(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!this.url || !this.token) {
      return true; // Fallback to allowing request if not configured
    }

    try {
      // Atomic increment and expire using Lua script via Upstash REST API
      const luaScript = `
        local current = redis.call('incr', KEYS[1])
        if current == 1 then
          redis.call('expire', KEYS[1], tonumber(ARGV[2]))
        end
        return current <= tonumber(ARGV[1]) and 1 or 0
      `;

      const response = await fetch(`${this.url}/eval`, {
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
        `Upstash rate limiting failed: ${err instanceof Error ? err.message : err}. Falling open.`,
      );
      return true;
    }
  }
}

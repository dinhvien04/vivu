import { Injectable, Logger } from '@nestjs/common';
import { fetchJson } from './fetch-json';

export interface KvStore {
  setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class InMemoryKvStore implements KvStore {
  private readonly records = new Map<string, { value: string; expiresAt: number }>();

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.records.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    const record = this.records.get(key);
    if (!record) return null;
    if (record.expiresAt <= Date.now()) {
      this.records.delete(key);
      return null;
    }
    return JSON.parse(record.value) as T;
  }

  async delete(key: string): Promise<void> {
    this.records.delete(key);
  }
}

@Injectable()
export class UpstashKvStore implements KvStore {
  private readonly logger = new Logger(UpstashKvStore.name);
  private readonly url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  private readonly token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.url || !this.token) return;
    try {
      const response = await fetchJson(`${this.url}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(value),
          ex: ttlSeconds,
        }),
        timeoutMs: 5_000,
      });
      if (!response.ok) {
        throw new Error(`Upstash SET failed: ${response.status}`);
      }
    } catch (err) {
      this.logger.error(`Upstash KV set failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.url || !this.token) return null;
    try {
      const response = await fetchJson(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        timeoutMs: 5_000,
      });
      if (!response.ok) return null;
      const json = (await response.json()) as { result?: string | null };
      if (!json.result) return null;
      return JSON.parse(json.result) as T;
    } catch (err) {
      this.logger.error(`Upstash KV get failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.url || !this.token) return;
    try {
      await fetchJson(`${this.url}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        timeoutMs: 5_000,
      });
    } catch (err) {
      this.logger.error(`Upstash KV delete failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}

export const KV_STORE = Symbol('KV_STORE');

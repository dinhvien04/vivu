import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { KV_STORE, type KvStore } from '../common/upstash-kv.store';
import { sanitizeRelativePath } from '../common/sanitize-path';

const OAUTH_STATE_TTL_SECONDS = 300;

export interface OAuthStatePayload {
  nonce: string;
  next: string;
  origin: string;
  createdAt: number;
  expiresAt: number;
}

export interface VerifiedOAuthState {
  next: string;
  origin: string;
}

@Injectable()
export class OAuthStateService {
  private readonly allowedOrigins: Set<string>;
  private readonly defaultOrigin: string;

  constructor(
    @Inject(KV_STORE) private readonly kv: KvStore,
    config: ConfigService,
  ) {
    const redirects = (config.get<string>('GOOGLE_ALLOWED_REDIRECTS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    this.allowedOrigins = new Set(redirects);
    this.defaultOrigin =
      redirects[0] ??
      config.get<string>('CORS_ORIGINS')?.split(',')[0]?.trim() ??
      'http://localhost:3000';
  }

  async createState(next: unknown, origin: unknown): Promise<string> {
    const nonce = randomBytes(32).toString('base64url');
    const now = Date.now();
    const payload: OAuthStatePayload = {
      nonce,
      next: sanitizeRelativePath(next),
      origin: this.normalizeOrigin(origin),
      createdAt: now,
      expiresAt: now + OAUTH_STATE_TTL_SECONDS * 1000,
    };

    await this.kv.setJson(this.storageKey(nonce), payload, OAUTH_STATE_TTL_SECONDS);
    return nonce;
  }

  async verifyAndConsumeState(state: unknown): Promise<VerifiedOAuthState> {
    const nonce = this.extractNonce(state);
    if (!nonce) {
      throw new BadRequestException('OAuth state không hợp lệ');
    }

    const key = this.storageKey(nonce);
    const stored = await this.kv.getJson<OAuthStatePayload>(key);
    if (!stored?.nonce || stored.nonce !== nonce) {
      throw new UnauthorizedException('OAuth state không hợp lệ hoặc đã hết hạn');
    }

    if (stored.expiresAt <= Date.now()) {
      await this.kv.delete(key);
      throw new UnauthorizedException('OAuth state đã hết hạn');
    }

    await this.kv.delete(key);

    const origin = this.normalizeOrigin(stored.origin);
    if (!this.isAllowedOrigin(origin)) {
      throw new UnauthorizedException('OAuth redirect origin không được phép');
    }

    return {
      next: sanitizeRelativePath(stored.next),
      origin,
    };
  }

  resolveAllowedOrigin(origin: string): string {
    const normalized = this.normalizeOrigin(origin);
    if (!this.isAllowedOrigin(normalized)) {
      throw new UnauthorizedException('OAuth redirect origin không được phép');
    }
    return normalized;
  }

  getDefaultOrigin(): string {
    return this.defaultOrigin;
  }

  private extractNonce(state: unknown): string | null {
    if (typeof state !== 'string') return null;
    const trimmed = state.trim();
    if (!trimmed) return null;
    if (/^[A-Za-z0-9_-]{16,128}$/.test(trimmed)) {
      return trimmed;
    }
    try {
      const decoded = Buffer.from(trimmed, 'base64url').toString('utf8');
      if (/^[A-Za-z0-9_-]{16,128}$/.test(decoded)) {
        return decoded;
      }
    } catch {
      // ignore legacy/base64 JSON states
    }
    return null;
  }

  private storageKey(nonce: string): string {
    return `oauth:state:${nonce}`;
  }

  private normalizeOrigin(origin: unknown): string {
    if (typeof origin !== 'string') return this.defaultOrigin;
    const trimmed = origin.trim();
    if (!trimmed) return this.defaultOrigin;
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return this.defaultOrigin;
      }
      return `${url.protocol}//${url.host}`.toLowerCase();
    } catch {
      return this.defaultOrigin;
    }
  }

  private isAllowedOrigin(origin: string): boolean {
    if (this.allowedOrigins.size === 0) {
      return origin === this.defaultOrigin.toLowerCase();
    }
    return this.allowedOrigins.has(origin.toLowerCase());
  }
}

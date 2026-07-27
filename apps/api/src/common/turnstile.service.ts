import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { FetchTimeoutError, fetchJson } from './fetch-json';
import { getClientIp } from './request-fingerprint';

interface TurnstileVerifyResponse {
  success?: boolean;
  'error-codes'?: string[];
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly enabled: boolean;
  private readonly secretKey: string | undefined;

  constructor(config: ConfigService) {
    this.enabled = config.get<string>('TURNSTILE_ENABLED') === 'true';
    this.secretKey = config.get<string>('TURNSTILE_SECRET_KEY')?.trim() || undefined;
  }

  async verify(token: string | undefined, request: FastifyRequest): Promise<void> {
    if (!this.enabled) return;
    if (!this.secretKey) {
      this.logger.error('TURNSTILE_ENABLED=true but TURNSTILE_SECRET_KEY is missing.');
      throw new BadRequestException('Hệ thống chống spam chưa được cấu hình đúng.');
    }
    if (!token?.trim()) {
      throw new BadRequestException('Vui lòng xác minh chống spam rồi thử lại.');
    }

    const body = new URLSearchParams({
      secret: this.secretKey,
      response: token,
      remoteip: getClientIp(request),
    });

    let payload: TurnstileVerifyResponse;
    try {
      const response = await fetchJson(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body,
          timeoutMs: 5_000,
        },
      );
      payload = (await response.json()) as TurnstileVerifyResponse;
    } catch (error) {
      if (error instanceof FetchTimeoutError) {
        this.logger.warn(JSON.stringify({ event: 'turnstile_timeout' }));
        throw new ServiceUnavailableException(
          'Không thể xác minh chống spam lúc này. Vui lòng thử lại sau.',
        );
      }
      this.logger.warn(
        JSON.stringify({
          event: 'turnstile_verify_failed',
          reason: error instanceof Error ? error.name : 'unknown',
        }),
      );
      throw new BadRequestException('Không xác minh được chống spam. Vui lòng thử lại.');
    }

    if (!payload.success) {
      this.logger.warn(
        JSON.stringify({
          event: 'turnstile_rejected',
          codes: payload['error-codes'] ?? [],
        }),
      );
      throw new BadRequestException(
        'Xác minh chống spam không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
      );
    }
  }
}

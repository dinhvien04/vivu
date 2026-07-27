import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { isJestRuntime, isProductionEnv, isTestEnv } from '../common/upstash-env';

const PLACEHOLDER_PATTERN = /replace-me|changeme|secret|default|placeholder|test-secret/i;
const MIN_PRODUCTION_LENGTH = 32;

const logger = new Logger('JwtSecret');

export function resolveJwtAccessSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_ACCESS_SECRET')?.trim();
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not set. Add it to apps/api/.env');
  }

  const weak = isWeakJwtSecret(secret);
  if (isProductionEnv() && !isTestEnv() && !isJestRuntime()) {
    if (weak) {
      throw new Error(
        'JWT_ACCESS_SECRET is too weak for production. Use a random string of at least 32 characters that is not a placeholder.',
      );
    }
  } else if (weak) {
    logger.warn(
      'JWT_ACCESS_SECRET looks weak. Use a long random value before deploying to production.',
    );
  }

  return secret;
}

export function isWeakJwtSecret(secret: string): boolean {
  if (secret.length < MIN_PRODUCTION_LENGTH) return true;
  return PLACEHOLDER_PATTERN.test(secret);
}

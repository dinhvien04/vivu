import { createHash } from 'crypto';
import type { FastifyRequest } from 'fastify';

export function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return firstForwarded?.split(',')[0]?.trim() || request.ip || 'unknown';
}

export function hashWithSecret(value: string, secret: string): string {
  return createHash('sha256').update(secret).update(':').update(value).digest('hex');
}

export function hashRequestIp(request: FastifyRequest, secret: string): string {
  return hashWithSecret(`ip:${getClientIp(request)}`, secret);
}

export function hashUserAgent(request: FastifyRequest, secret: string): string | undefined {
  const ua = request.headers['user-agent'];
  const value = Array.isArray(ua) ? ua.join(' ') : ua;
  if (!value) return undefined;
  return hashWithSecret(`ua:${value}`, secret);
}

export function utcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function isJestRuntime(): boolean {
  return process.env.JEST_WORKER_ID !== undefined;
}

export function hasUpstashRedisConfig(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return Boolean(url && token);
}

export function shouldFailClosedOnRedisErrors(): boolean {
  return isProductionEnv() && !isTestEnv();
}

/** Fail fast at startup when production requires distributed Redis/KV. */
export function assertUpstashRedisInProduction(): void {
  if (!isProductionEnv() || isTestEnv() || isJestRuntime()) return;
  if (!hasUpstashRedisConfig()) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for OAuth state, rate limiting, and abuse protection.',
    );
  }
}

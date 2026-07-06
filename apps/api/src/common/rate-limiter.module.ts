import { Global, Module } from '@nestjs/common';
import {
  InMemoryRateLimiterStore,
  RATE_LIMITER_STORE,
  UpstashRedisRateLimiterStore,
} from './rate-limiter.store';

@Global()
@Module({
  providers: [
    InMemoryRateLimiterStore,
    UpstashRedisRateLimiterStore,
    {
      provide: RATE_LIMITER_STORE,
      useFactory: (upstash: UpstashRedisRateLimiterStore, memory: InMemoryRateLimiterStore) => {
        const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
        const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
        return url && token ? upstash : memory;
      },
      inject: [UpstashRedisRateLimiterStore, InMemoryRateLimiterStore],
    },
  ],
  exports: [RATE_LIMITER_STORE, InMemoryRateLimiterStore, UpstashRedisRateLimiterStore],
})
export class RateLimiterModule {}
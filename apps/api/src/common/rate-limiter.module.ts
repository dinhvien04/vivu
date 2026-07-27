import { Global, Module } from '@nestjs/common';
import {
  createRateLimiterStore,
  InMemoryRateLimiterStore,
  RATE_LIMITER_STORE,
  UpstashRedisRateLimiterStore,
} from './rate-limiter.store';
import { assertUpstashRedisInProduction } from './upstash-env';

@Global()
@Module({
  providers: [
    InMemoryRateLimiterStore,
    UpstashRedisRateLimiterStore,
    {
      provide: RATE_LIMITER_STORE,
      useFactory: (upstash: UpstashRedisRateLimiterStore, memory: InMemoryRateLimiterStore) => {
        assertUpstashRedisInProduction();
        return createRateLimiterStore(upstash, memory);
      },
      inject: [UpstashRedisRateLimiterStore, InMemoryRateLimiterStore],
    },
  ],
  exports: [RATE_LIMITER_STORE, InMemoryRateLimiterStore, UpstashRedisRateLimiterStore],
})
export class RateLimiterModule {}

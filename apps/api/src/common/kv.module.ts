import { Global, Module } from '@nestjs/common';
import { InMemoryKvStore, KV_STORE, UpstashKvStore } from './upstash-kv.store';
import { assertUpstashRedisInProduction, hasUpstashRedisConfig } from './upstash-env';

@Global()
@Module({
  providers: [
    InMemoryKvStore,
    UpstashKvStore,
    {
      provide: KV_STORE,
      useFactory: (upstash: UpstashKvStore, memory: InMemoryKvStore) => {
        assertUpstashRedisInProduction();
        return hasUpstashRedisConfig() ? upstash : memory;
      },
      inject: [UpstashKvStore, InMemoryKvStore],
    },
  ],
  exports: [KV_STORE, InMemoryKvStore, UpstashKvStore],
})
export class KvModule {}

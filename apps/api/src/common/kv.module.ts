import { Global, Module } from '@nestjs/common';
import { InMemoryKvStore, KV_STORE, UpstashKvStore } from './upstash-kv.store';

@Global()
@Module({
  providers: [
    InMemoryKvStore,
    UpstashKvStore,
    {
      provide: KV_STORE,
      useFactory: (upstash: UpstashKvStore, memory: InMemoryKvStore) => {
        const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
        const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
        return url && token ? upstash : memory;
      },
      inject: [UpstashKvStore, InMemoryKvStore],
    },
  ],
  exports: [KV_STORE, InMemoryKvStore, UpstashKvStore],
})
export class KvModule {}
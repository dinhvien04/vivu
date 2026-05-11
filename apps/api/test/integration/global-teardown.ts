/**
 * Jest globalTeardown — stop container đã start ở `global-setup.ts`.
 */
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  // eslint-disable-next-line no-var
  var __VIVU_PG__: StartedPostgreSqlContainer | undefined;
}

export default async function globalTeardown(): Promise<void> {
  if (globalThis.__VIVU_PG__) {
    await globalThis.__VIVU_PG__.stop();
    globalThis.__VIVU_PG__ = undefined;
  }
}

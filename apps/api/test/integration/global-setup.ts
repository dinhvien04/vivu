/**
 * Jest globalSetup cho integration test.
 *
 * 1. Khởi động container `postgis/postgis:15-3.4` (đã đi kèm PostGIS + pg_trgm).
 * 2. Áp dụng schema:
 *    - `prisma db push --skip-generate --accept-data-loss` để tạo các bảng từ
 *      `schema.prisma` (đảm bảo luôn đồng bộ với Prisma client).
 *    - Sau đó thêm các phần PostGIS-specific (extensions, trigram GIN index,
 *      `geo` column, trigger `place_geo_sync`, GIST index) mà Prisma không
 *      biết.
 * 3. Export `DATABASE_URL` cho mọi test file (jest chạy với `--runInBand` nên
 *    env này được thừa kế bởi worker duy nhất).
 * 4. Giữ reference container ở `globalThis.__VIVU_PG__` để teardown stop được.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __VIVU_PG__: StartedPostgreSqlContainer | undefined;
}

// SQL chạy SAU `prisma db push` — chỉ những thứ Prisma không tự tạo được.
// Mirror các block tương ứng trong `prisma/schema.sql`.
const POSTGIS_BOOTSTRAP = `
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS postgis;

  CREATE INDEX IF NOT EXISTS "Place_titleVi_trgm_idx"
      ON "Place" USING GIN ("titleVi" gin_trgm_ops);

  ALTER TABLE "Place"
      ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);

  CREATE INDEX IF NOT EXISTS "Place_geo_gist_idx"
      ON "Place" USING GIST ("geo");

  CREATE OR REPLACE FUNCTION place_sync_geo() RETURNS TRIGGER AS $$
  BEGIN
      IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
          NEW.geo := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
      ELSE
          NEW.geo := NULL;
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS place_geo_sync ON "Place";
  CREATE TRIGGER place_geo_sync
      BEFORE INSERT OR UPDATE OF "lat", "lng" ON "Place"
      FOR EACH ROW EXECUTE FUNCTION place_sync_geo();
`;

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgis/postgis:15-3.4')
    .withDatabase('vivu_int')
    .withUsername('vivu')
    .withPassword('vivu')
    .start();

  globalThis.__VIVU_PG__ = container;
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // 1) Prisma db push — schema tables/columns/enums/indexes Prisma biết.
  const apiDir = resolve(__dirname, '..', '..');
  const prismaCliPath = resolve(apiDir, 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(
    process.execPath,
    [prismaCliPath, 'db', 'push', '--skip-generate', '--accept-data-loss'],
    {
      cwd: apiDir,
      env: { ...process.env, DATABASE_URL: url },
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `[int] prisma db push failed (exit ${result.status}): ${result.error?.message ?? 'unknown error'}\n${result.stdout}\n${result.stderr}`,
    );
  }

  // 2) PostGIS-specific (extension + geography column + trigger + GIST/GIN indexes).
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query(POSTGIS_BOOTSTRAP);
  await client.end();

  console.log(`[int] PostGIS container ready at ${url}`);
}

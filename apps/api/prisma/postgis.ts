/**
 * Apply the PostGIS-specific DDL that Prisma cannot manage on its own.
 *
 * Background:
 *   `apps/api/prisma/schema.prisma` does not declare the `Place.geo`
 *   `geography(Point, 4326)` column, the `Place_geo_gist_idx` GIST index, or
 *   the `place_geo_sync` trigger that keeps `geo` in sync with `lat`/`lng` —
 *   Prisma does not have first-class types for PostGIS. That DDL lives in
 *   `apps/api/prisma/schema.sql` (consumed when bootstrapping a fresh DB on
 *   Neon) and is mirrored in the integration-test global setup.
 *
 *   Running `prisma db push` against a local Postgres only creates the
 *   tables/columns/enums/indexes Prisma knows about — it does NOT create the
 *   `geo` column. Therefore `/api/v1/places/nearby` (which executes
 *   `ST_DWithin` against `Place.geo`) fails with:
 *
 *     Raw query failed. Code: `42703`. Message: `column "geo" does not exist`
 *
 * This script applies the PostGIS DDL idempotently against the DB pointed to
 * by `DATABASE_URL` (defaults to the docker-compose Postgres). Safe to run
 * multiple times — every statement uses `IF NOT EXISTS` / `OR REPLACE` /
 * `DROP TRIGGER IF EXISTS` so it never breaks an already-bootstrapped DB.
 *
 * Usage:
 *   pnpm --filter @vivu/api postgis:up
 */
// Importing @prisma/client triggers Prisma's built-in dotenv loader which
// reads `apps/api/.env` and populates `process.env.DATABASE_URL` (same trick
// `prisma/seed.ts` relies on). We don't use PrismaClient for the actual DDL —
// raw `pg` is required because `CREATE OR REPLACE FUNCTION … $$ … $$` uses
// dollar-quoting that Prisma's `$executeRaw` template-tag interprets.
import '@prisma/client';
import { Client } from 'pg';

const POSTGIS_DDL = `
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

  UPDATE "Place"
  SET "geo" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
  WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL AND "geo" IS NULL;
`;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot apply PostGIS DDL.');
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(POSTGIS_DDL);
    // eslint-disable-next-line no-console
    console.log('[postgis] applied successfully (idempotent).');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[postgis] failed:', err);
  process.exit(1);
});

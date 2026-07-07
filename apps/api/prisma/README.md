# Vivu API database

## Source of truth

`schema.prisma` and the versioned SQL files under `migrations/` are the canonical schema. Use Prisma Migrate for production and team environments.

`schema.sql` is a generated, idempotent bootstrap script for empty databases (for example Neon SQL Editor). Regenerate it after schema changes:

```bash
pnpm --filter @vivu/api exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/schema.generated.sql
```

Then merge the header, generated DDL, and the PostGIS appendix from `schema.sql`.

## Local development

```bash
pnpm --filter @vivu/api db:setup
```

This runs `prisma migrate dev`, then `postgis:up` for the `Place.geo` column, GIST index, and sync trigger.

## Production deployment

1. Set `DATABASE_URL` (with connection pooling for serverless hosts).
2. Apply migrations:

```bash
pnpm --filter @vivu/api prisma:migrate:deploy
```

3. Apply PostGIS DDL once per database (safe to re-run):

```bash
pnpm --filter @vivu/api postgis:up
```

Do **not** use `prisma db push --accept-data-loss` in production.

## PostGIS note

Prisma does not model `Place.geo geography(Point, 4326)`. The column, GIST index, and `place_geo_sync` trigger live in `schema.sql` / `postgis.ts` and are required for `/places/nearby`.

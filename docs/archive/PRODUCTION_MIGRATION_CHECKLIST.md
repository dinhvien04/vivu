# Production Migration Checklist

Use this checklist before promoting a backend deploy that includes Prisma schema or data-shape changes.

## Before Deploy

- Confirm the target branch is `main` and CI checks are green.
- Confirm production env variables exist for both projects:
  - API: `DATABASE_URL`, JWT secrets, CORS, Qdrant, Gemini, AWS/S3, Turnstile and abuse-control settings.
  - Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_IMAGE_REMOTE_HOSTS`, optional `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Run locally from the repo root:

```bash
pnpm prisma:generate
pnpm typecheck
pnpm --filter @vivu/api test
pnpm --filter @vivu/web build
```

## Apply Database Changes

- Review new Prisma migrations under `apps/api/prisma/migrations`.
- Back up the production database or confirm provider point-in-time recovery is enabled.
- Apply migrations against production with the deployment provider workflow or:

```bash
pnpm --filter @vivu/api prisma migrate deploy
```

- Do not use `prisma db push --accept-data-loss` on production.
- If a migration adds nullable columns that are later required, deploy in two steps:
  1. Add nullable schema and code that can read old/new data.
  2. Backfill data, then enforce the stricter constraint in a later migration.

## After Deploy

- Open `/build-info` on the web deployment and verify `commitSha` matches the expected commit.
- Open `/api/build-info` and confirm it returns the same safe metadata.
- Smoke test:
  - `/`
  - `/en`
  - `/kham-pha`
  - `/ban-do`
  - `/lich-trinh`
  - `/tu-van`
  - `/ai-chat`
- Verify private pages and admin endpoints still require auth.
- Verify shared itinerary links:
  - A newly shared link opens.
  - After `Tắt chia sẻ`, the old link returns not found.
- Check Vercel logs for new 4xx/5xx spikes.

## Rollback Notes

- Prefer rollback by redeploying the previous known-good commit.
- If a database migration is not reversible, keep code backward compatible until the data can be repaired.
- Rotate secrets immediately if any deployment log or client bundle accidentally exposes private values.

# Production Smoke Test

Run this after every production deploy or after changing Vercel environment variables.

## Build Info

```bash
curl https://vivu-web.vercel.app/build-info
curl https://vivu-web.vercel.app/api/build-info
```

Expected:

- `app` is `vivu-web`.
- `commitSha` matches the commit promoted to production.
- `defaultLocale` is `vi`.
- No secrets are present.

For automated Playwright smoke:

```bash
E2E_BASE_URL=https://vivu-web.vercel.app E2E_EXPECT_COMMIT=<commit-sha> pnpm e2e:web
```

If you only want to validate test discovery:

```bash
pnpm --filter @vivu/web test:e2e:list
```

## Public Routes

- `/` opens Vietnamese home and must not redirect to `/en`.
- `/en` opens English home and keeps the `/en` prefix.
- `/kham-pha` loads places from the API.
- `/ban-do` loads the map when coordinates are available.
- `/lich-trinh` opens the AI trip planner.
- `/tu-van` opens the consultation form.
- `/ai-chat` opens the AI chat UI.
- `/robots.txt` returns a valid robots file.
- `/sitemap.xml` returns a valid sitemap and must not include shared itinerary URLs.

## Trip Planner

- Anonymous users can generate a limited itinerary.
- Logged-in users can save an itinerary.
- Logged-in users can share an itinerary.
- `Tắt chia sẻ` revokes the public share link.
- Old share links should return not found after revocation.
- Playwright has a mocked trip-planner test so CI does not call Gemini.

## Turnstile

- When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and API `TURNSTILE_ENABLED=true` are set, public abuse-prone forms render Cloudflare Turnstile.
- Missing or invalid Turnstile tokens should return a friendly 400 response.
- Disabling Turnstile in non-production should not block local testing.

## API Privacy

- Public shared itinerary responses must not include:
  - `userId`
  - email
  - phone/Zalo
  - lead data
  - internal notes
  - tokens
  - private prompt/input payloads
- Admin endpoints must require JWT auth and the proper role.

# Uptime & Error Monitoring Checklist

Use this checklist to set up alerting for critical failures on the Vivu platform.

## 1. Uptime Monitoring
Set up an external uptime checker (e.g., Uptime Robot, Better Uptime) targeting:
- **Web App**: `https://vivu-web.vercel.app/build-info` (Expected: 200 OK)
- **API Health**: `https://vivu-api.vercel.app/healthz` (Expected: 200 OK)
- **API Readiness**: `https://vivu-api.vercel.app/readyz` (Expected: 200 OK)

## 2. Critical Alert Thresholds

| Alert Type | Source | Action Threshold | Recommended Channel |
|---|---|---|---|
| **API 5xx Server Errors** | Vercel Logs / Sentry | > 5 errors in 5 minutes | Discord / Slack / Telegram |
| **Lead Submission Failure** | Vercel Logs | Any failed `POST /api/v1/leads` | Email / SMS / Telegram |
| **Data Report Failure** | Vercel Logs | Any failed `POST /api/v1/data-reports` | Email / Slack |
| **AI Request Failure (500/503)** | Vercel Logs | Any 5xx on `/api/v1/ai/chat` | Discord / Slack |
| **Trip Planner Failure (500/503)** | Vercel Logs | Any 5xx on `/api/v1/trip-plans/generate` | Discord / Slack |
| **AI Chat Rate Limiting (429)** | Vercel Logs / Redis | > 30 blocks in 10 minutes | Slack / AlertManager |
| **Trip Planner Rate Limiting (429)** | Vercel / Redis | > 10 blocks in 10 minutes | Slack / AlertManager |
| **Billing Alerts** | Vercel / GCP / AWS / Neon | Budget exceeded 80% | Email / Push Notification |

## 3. Log Privacy & Security Compliance (CRITICAL)
To ensure compliance with security audits and user privacy policies:
- **NO PERSONAL DATA**: Never log full name, phone number, Zalo account, or email address in plaintext.
- **NO SECURITY TOKENS**: Redact bearer JWT tokens, session headers, and API keys.
- **NO RAW PROMPTS**: Do not log raw user input prompts sent to Gemini in system logs (save only metadata/length/tokens count).

## 4. Sentry Integration
If integrated, verify:
- `@sentry/nextjs` is configured in `apps/web/next.config.mjs`.
- NestJS uses Sentry interceptors to capture runtime backend exceptions.
- DSN tokens are configured as environment secrets, not hardcoded.


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
| **API 500 Internal Errors** | Vercel Logs / Sentry | > 5 errors in 5 minutes | Discord / Slack / Telegram |
| **Lead Submission Failure** | Vercel Logs | Any failed `POST /api/v1/leads` | Email / SMS |
| **AI Request Failure** | Vercel Logs | Any 5xx on `/api/v1/ai/chat` | Discord / Slack |
| **Billing Alerts** | Vercel / GCP / AWS | Budget exceeded 80% | Email / Push Notification |

## 3. Sentry Integration
If integrated, verify:
- `@sentry/nextjs` is configured in `apps/web/next.config.mjs`.
- NestJS uses Sentry interceptors to capture runtime backend exceptions.
- DSN tokens are configured as environment secrets, not hardcoded.

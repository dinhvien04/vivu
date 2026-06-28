# AI Cost and Abuse Guardrails

This document describes how to protect the Vivu platform against Gemini/Qdrant billing spikes and API abuse.

## Emergency Kill Switches (Feature Toggles)

If the platform experiences heavy abuse or sudden cost spikes, disable AI features immediately by setting these environment variables on Vercel:

### 1. Disable All AI Chat Features

Set on **Vercel API environment variables**:

```env
AI_FEATURE_ENABLED=false
```

- **Behavior**: Calls to `/api/v1/ai/chat` will immediately throw a `503 Service Unavailable` with the message: _"Vivu AI đang tạm bảo trì, vui lòng thử lại sau."_

### 2. Disable AI Trip Planner

Set on **Vercel API environment variables**:

```env
TRIP_PLANNER_FEATURE_ENABLED=false
```

- **Behavior**: Calls to `/api/v1/trip-plans/generate` will return `503 Service Unavailable` with: _"Tính năng tạo lịch trình AI đang tạm bảo trì, vui lòng gửi yêu cầu tư vấn để Vivu hỗ trợ."_ The UI will display a link guiding users to `/tu-van`.

---

## Quota & Billing Alert Recommendations

To prevent surprise billing, set up the following budget alerts:

### 1. Google Gemini (Google Cloud Console)

- **Daily Quotas**: Restrict the number of daily requests in the Google AI Studio / GCP API console.
- **Budget Alerts**: Set up billing alerts at $10, $50, and $100 thresholds.

### 2. Qdrant Cloud

- Use the **free tier** cluster for low-traffic development/MVP.
- For production, set hard limits on memory/storage size.

### 3. Vercel

- Enable **Spend Limits** in the billing tab to pause projects when they exceed usage limits.

### 4. Neon Database

- Enable auto-suspend for development databases.
- Set a compute limit scaling cap (e.g. max 1.0 CU or 2.0 CU) to prevent autoscaling cost spikes.

---

## 3. Rate Limiting & Anonymous Quotas

To prevent bot spam from draining Gemini resources, Vivu implements global rate limiting for anonymous users:

- **Rate Limit Store**: Configured via the `rate-limiter.store.ts` implementing two storage strategies:
  - **In-Memory Store (Default/Dev)**: Stores rate limit state in local server memory. _Note: This is not shared across multiple Vercel serverless instances._
  - **Upstash Redis Store (Production)**: Uses a lightweight, dependency-free Lua script over REST HTTP to sync rate limit states globally across all serverless deployments.
- **Default Thresholds**:
  - AI Chat requests: 10 requests / 5 minutes per IP.
  - Trip Planner requests: 3 requests / 1 hour per IP.

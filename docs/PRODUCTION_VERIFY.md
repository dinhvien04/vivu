# Production Deployment Verification Guide

This guide explains how to verify which commit is running on production for both the Web application and the API backend.

## Web Application Verification

Open the following endpoint in your browser or query it via curl:
```bash
curl https://vivu-web.vercel.app/build-info
```

### Expected Response Format
```json
{
  "app": "vivu-web",
  "commitSha": "64ff1247e015a9afb010e02116eb704ac1327160",
  "commitMessage": "...",
  "vercelEnv": "production",
  "buildTime": "2026-06-25T...",
  "defaultLocale": "vi",
  "siteUrl": "https://vivu-web.vercel.app"
}
```

---

## API Backend Verification

Query the API build-info endpoint:
```bash
curl https://vivu-api.vercel.app/api/v1/build-info
```

### Expected Response Format
```json
{
  "app": "vivu-api",
  "commitSha": "64ff1247e015a9afb010e02116eb704ac1327160",
  "commitMessage": "...",
  "vercelEnv": "production",
  "nodeEnv": "production",
  "buildTime": "2026-06-25T..."
}
```

---

## Manual Smoke Verification Checklist

1. **Verify Home Page**:
   - Access `https://vivu-web.vercel.app/`. Ensure it loads in Vietnamese and doesn't redirect automatically to `/en`.
   - Access `https://vivu-web.vercel.app/en`. Verify English localization functions.
2. **Verify AI Trip Planner**:
   - Open `/lich-trinh`, input options and verify "Tạo lịch trình AI" button is visible and works.
3. **Verify Consulting Form**:
   - Open `/tu-van`, fill in fields, and ensure Turnstile loads. Test submission.
4. **Verify SEO files**:
   - Query `/robots.txt` and `/sitemap.xml` to check rules and URLs.

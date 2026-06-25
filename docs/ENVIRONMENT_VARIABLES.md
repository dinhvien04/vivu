# Environment Variables Configuration Guide

This document lists all environment variables required for deploying and running Vivu in production on Vercel.

## 1. Web Application (`apps/web`)

Configure these variables in your **Vercel Web Project**:

| Variable Name | Purpose | Example / Recommendations |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | The public endpoint of the API backend. | `https://vivu-api.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | The canonical URL of the web frontend. | `https://vivu-web.vercel.app` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile Site Key for form security. | `2x00000000000000000000AB` (or leave empty to disable) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support email displayed on Contact / Privacy pages. | `vien.computer.2004@gmail.com` (falls back to this if empty) |
| `NEXT_PUBLIC_FACEBOOK_URL` | Link to the official Facebook page. | `https://facebook.com/vivu` (leave empty to hide icon) |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Link to the official Instagram page. | `https://instagram.com/vivu` (leave empty to hide icon) |
| `NEXT_PUBLIC_YOUTUBE_URL` | Link to the official YouTube channel. | `https://youtube.com/c/vivu` (leave empty to hide icon) |

---

## 2. API Backend (`apps/api`)

Configure these variables in your **Vercel API Project**:

| Variable Name | Purpose | Example / Recommendations |
|---|---|---|
| `DATABASE_URL` | Connection pool URL for Neon Database. | `postgresql://neondb_owner:...-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` (Pooled connection recommended for serverless) |
| `DIRECT_DATABASE_URL` | Non-pooled direct database URL. | `postgresql://neondb_owner:...ap-southeast-1.aws.neon.tech/neondb?sslmode=require` (Use only during migrations) |
| `JWT_ACCESS_SECRET` | Secret key used for signing short-lived JWT access tokens. | Generate a strong random value, e.g. `openssl rand -base64 48`. |
| `JWT_REFRESH_SECRET` | Reserved refresh-token secret for compatibility/config checks. Refresh tokens are stored server-side as hashes. | Generate a strong random value and keep it separate from `JWT_ACCESS_SECRET`. |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key. | Secure key for generating AI plans/chat. |
| `TURNSTILE_ENABLED` | Toggle Turnstile verification in API. | `true` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret Key. | Cloudflare backend verification secret key. |
| `AI_FEATURE_ENABLED` | Global toggle for all AI chatbot features. | `true` (defaults to `true` if unset) |
| `TRIP_PLANNER_FEATURE_ENABLED`| Global toggle for the AI Trip Planner feature. | `true` (defaults to `true` if unset) |

---

> [!WARNING]
> - Never expose backend secrets (like `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`) to the frontend web application. Only prefix frontend-safe environment variables with `NEXT_PUBLIC_`.
> - Always restart the local dev server after changing `.env.local` or `.env` files for the variables to take effect.

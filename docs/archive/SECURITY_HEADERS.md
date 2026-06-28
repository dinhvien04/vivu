# Security Headers & Content Security Policy (CSP)

This document describes the headers and CSP policy configured on the Next.js web application.

## 1. Configured Headers

Vivu appends the following headers on all client pages via `apps/web/next.config.mjs`:

- **Content-Security-Policy**: Controls the resources browser is allowed to fetch or execute.
- **X-Content-Type-Options: `nosniff`**: Prevents the browser from MIME-sniffing a response away from the declared content-type.
- **Referrer-Policy: `strict-origin-when-cross-origin`**: Controls how much referrer information is sent with requests.
- **X-Frame-Options: `DENY`**: Protects against clickjacking by preventing the site from being embedded inside a frame.
- **Permissions-Policy**: Restricts browser features:
  - `camera=()` (Disabled)
  - `microphone=()` (Disabled)
  - `geolocation=(self)` (Allowed only for the current domain for map integration)
  - `payment=()` (Disabled)
  - `usb=()` (Disabled)

## 2. Content Security Policy (CSP) Specifications

The CSP directives are configured as follows:

- `default-src 'self'`: Default fallback for fetching files/scripts to our own domain.
- `script-src`: Restricts scripts to self, inline blocks (required by Next.js), and `https://challenges.cloudflare.com` (Turnstile).
- `style-src`: Restricts styles to self, inline styles, and Google Fonts CSS.
- `font-src`: Restricts fonts to self, data URIs, and Google Fonts.
- `img-src`: Restricts image assets to self, data URIs, S3 bucket storage, and Cloudinary CDN URLs.
- `connect-src`: Permits API calls to the configured NestJS backend, Turnstile endpoints, and Open-Meteo weather API.
- `frame-src`: Permits embedding third-party widgets from `https://challenges.cloudflare.com`.
- `frame-ancestors 'none'`: Prevents clickjacking by blocking iframe embeddings.

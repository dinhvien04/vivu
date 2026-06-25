# Authentication & Session Security Audit

This document outlines the authentication structure, session management, and cross-origin controls implemented in Vivu.

## 1. Authentication Mechanisms
- **Bearer access tokens**: Vivu uses short-lived JWT access tokens for API authentication.
- **Header injection**: Protected API calls include `Authorization: Bearer <accessToken>`.
- **Client storage**: Access tokens are kept in React memory only by `AuthProvider`; they are not persisted to `localStorage` or query strings.
- **Refresh session**: The Next.js auth route handlers store the refresh token in an `httpOnly`, `sameSite=lax` cookie scoped to `/api/auth`.

## 2. JWT Strategy & Lifecycle
- **Access Tokens**: Short-lived signatures verifying user identity. The API JWT strategy reloads the user from the database on each protected request, so current DB role is authoritative.
- **Signature Verification**: Validated on the API backend using `JwtAuthGuard` and NestJS Passport JWT strategy.
- **Token Claims**: Contains the token payload (`sub`, `email`, `role`). Excludes sensitive fields like full user records or raw passwords.
- **Refresh tokens**: Stored in the database by SHA-256 hash, rotated on refresh, revoked on logout/password reset/change-password.

## 3. CORS Policies
- **Origin Control**: The API backend restricts CORS origins using the configured client URL. Wildcards (`*`) are disallowed for state-changing authenticated operations.
- **Preflight Checks**: Options requests from unauthorized origins are rejected.

## 4. CSRF Protection
- State-changing backend API calls rely on custom `Authorization: Bearer` headers instead of ambient backend cookies, reducing standard CSRF exposure.
- The refresh cookie is scoped to the Next.js `/api/auth` proxy routes and uses `sameSite=lax`, `httpOnly`, and `secure` in production.

## 5. Security Recommendations
- **CSRF hardening TODO**: If more cookie-authenticated state-changing proxy routes are added under `/api/auth`, add a same-origin or CSRF-token check for those routes.
- **Token invalidation**: Role changes are picked up on the next protected API request because the JWT strategy reads the user from the database. Password changes revoke refresh tokens.

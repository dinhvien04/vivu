# Authentication & Session Security Audit

This document outlines the authentication structure, session management, and cross-origin controls implemented in Vivu.

## 1. Authentication Mechanisms
- **Bearer Tokens**: Vivu uses JSON Web Tokens (JWT) for user authentication.
- **Header Injection**: Requests to protected API endpoints use the `Authorization: Bearer <token>` header.
- **Client Storage**: Tokens are stored securely in `localStorage` in the web client, avoiding query string exposures.

## 2. JWT Strategy & Lifecycle
- **Access Tokens**: Short-lived signatures verifying user identity and roles (`user`, `editor`, `admin`).
- **Signature Verification**: Validated on the API backend using `JwtAuthGuard` and NestJS Passport JWT strategy.
- **Token Claims**: Contains the token payload (`id`, `email`, `role`). Excludes sensitive fields like full user records or raw passwords.

## 3. CORS Policies
- **Origin Control**: The API backend restricts CORS origins using the configured client URL. Wildcards (`*`) are disallowed for state-changing authenticated operations.
- **Preflight Checks**: Options requests from unauthorized origins are rejected.

## 4. CSRF Protection
- Since the application relies on custom `Authorization: Bearer` headers instead of automatic ambient credentials (cookies), standard cross-site request forgery (CSRF) vulnerabilities are mitigated by design.

## 5. Security Recommendations
- **Refresh Token Rotation**: Implement standard token rotation playbooks if moving to cookie-based auth in production upgrades.
- **Token Invalidation**: Force check user roles/passwords directly from the database or Cache store if immediate revocation on role/password change is required.

# Vivu Backend Code Review — 2026-07-06

## Scope

Review of `apps/api` (NestJS + Fastify backend) covering architecture, security, performance, reliability, and code quality across the following modules:

- Bootstrap (`main.ts`)
- Root module (`app.module.ts`)
- Auth (JWT strategy, guards, decorators)
- Common (rate limiting, security headers, sanitization, Turnstile, abuse protection)
- AI chat (multipart handling, pipelines, quota)
- Trip plans (AI generation, fallback, sharing)
- Admin places (RBAC, audit logging)
- Public places (filtering, PostGIS nearby, presigned URLs)
- Storage (S3 presigned URL caching)
- Prisma service

---

## Overall Assessment

The codebase is **well-structured and production-aware**. It demonstrates strong security practices (CORS, Helmet, CSRF origin check, rate limiting, Turnstile verification, input sanitization), clean separation of concerns, and thoughtful error handling. The Vietnamese-language error messages show good localization for the target audience.

Below are findings organized by severity.

---

## 🔴 Critical Issues

### 1. `DATABASE_URL` leaked into logs via hostname check (prisma.service.ts:14)

```ts
const hostname = url.split('@')[1]?.split('/')[0]?.split('?')[0];
```

While only the hostname is extracted (not credentials), the raw `DATABASE_URL` is held in a local variable. If an unhandled exception occurs during `onModuleInit()` and a stack-trace logger captures local variables, the full connection string (including password) could be exposed. **Recommendation:** Extract hostname parsing into a helper that receives only the host portion, or use `new URL(url).hostname` inside a try/catch.

### 2. No global exception filter sanitizing error details (main.ts)

The bootstrap does not register a global exception filter. NestJS's default filter may leak internal error details (stack traces, Prisma error messages with table/column names) in non-production environments, and even in production if an unexpected error type is thrown. **Recommendation:** Add a global `AllExceptionsFilter` that:

- Returns generic messages for 5xx errors
- Strips Prisma-specific metadata
- Logs full details server-side only

---

## 🟠 High-Severity Issues

### 3. Presigned URL cache is unbounded in memory during bursts (s3.service.ts)

The `prunePresignedUrlCache` method only runs when a _new_ URL is being cached. Between prune cycles, the `pendingPresignedUrls` Map can grow without bound if many concurrent requests target distinct S3 keys. For large place listings (each with hero images + photos), this could cause memory pressure.

**Recommendation:** Add a periodic prune (e.g., `setInterval` in constructor) or use an LRU cache library like `lru-cache` which handles eviction automatically.

### 4. Raw SQL injection surface in `listNearby` (places.service.ts:349)

```ts
const excludeFilter =
  excludeSlug !== undefined ? Prisma.sql`AND "slug" <> ${excludeSlug}` : Prisma.sql``;
```

This correctly uses `Prisma.sql` tagged templates which parameterize values. ✅ No actual injection risk here — but the pattern of conditionally building SQL fragments is fragile. A future developer might accidentally use string interpolation instead.

**Recommendation:** Add a comment explaining why `Prisma.sql` is safe here, or extract into a dedicated repository method with explicit parameter binding.

### 5. Missing `@IsOptional()` or default validation on `AiChatDto` body fields

When `request.isMultipart()` is false, the body is used directly:

```ts
message: normalizeText(body?.message),
sessionId: normalizeText(body?.session_id),
```

If `body` is `undefined` (e.g., empty POST with `Content-Type: application/json`), `normalizeText(undefined)` returns `undefined`, which then flows into `inputRouter.route(undefined, undefined)`. This may cause a downstream error rather than a clean 400.

**Recommendation:** Add DTO validation (class-validator decorators) to `AiChatDto` and ensure the `ValidationPipe` is applied, or add an explicit guard at the top of `handleRequest`.

### 6. `collectPlaceIds` uses `Array.includes` on potentially large arrays (trip-plans.service.ts:428)

```ts
if (id && !ids.includes(id)) ids.push(id);
```

For trip plans with many places, this is O(n²). While currently bounded by candidate limits (~40), this should use a `Set` for correctness and future-proofing.

---

## 🟡 Medium-Severity Issues

### 7. Hardcoded province filter `'Gia Lai'` in multiple files

`PUBLIC_PROVINCE = 'Gia Lai'` is duplicated in `places.service.ts`, `trip-plans.service.ts`, and likely other modules. This makes multi-province expansion error-prone.

**Recommendation:** Extract to a shared constant or configuration value.

### 8. CORS origin validation is case-sensitive (main.ts)

```ts
if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin))
```

Browser origins are typically lowercase, but `CORS_ORIGINS` values from the environment could contain mixed case. This could cause legitimate requests to be rejected.

**Recommendation:** Normalize origins to lowercase when building the `Set` and when comparing.

### 9. `createUniqueShareId` has a silent fallback without uniqueness guarantee (trip-plans.service.ts:301-308)

```ts
// After 5 failed attempts:
return `${randomBytes(18).toString('base64url')}`;
```

The fallback generates a longer random string but doesn't verify it's unique. While a collision is extremely unlikely, this violates the method's contract.

**Recommendation:** Either increase attempts, or add a unique constraint violation catch-and-retry at the database level.

### 10. `isFileTooLargeError` relies on fragile regex pattern (ai-chat.service.ts:180-186)

```ts
/file.*large|limit/i.test(error.message);
```

This regex could false-match unrelated errors (e.g., "rate limit exceeded"). The `code` check is more reliable.

**Recommendation:** Prioritize error code checking and narrow the message regex, or check for specific Fastify multipart error types.

### 11. Missing request timeout for AI generation calls

Neither `ai-chat.service.ts` nor `trip-plans.service.ts` set explicit timeouts for AI provider calls. If the AI provider hangs, the request will hang indefinitely (or until Fastify's global timeout).

**Recommendation:** Add explicit per-call timeouts (e.g., `AbortController` with 30-60s timeout) for AI generation calls.

### 12. `toApiPlace` returns `createdAt` and `updatedAt` as ISO strings for public API

These fields expose internal metadata to public consumers. While not a security risk per se, they increase the API surface area unnecessarily.

**Recommendation:** Consider whether these fields are needed in the public API; if not, remove them.

---

## 🔵 Low-Severity / Code Quality Issues

### 13. Inconsistent error message language

Most user-facing errors are in Vietnamese (good for localization), but some system errors use English. The `RolesGuard` throws `'Bạn không có quyền truy cập tài nguyên này'` while the `S3Service` throws `'AI configuration is missing: AWS_BUCKET_NAME'`.

**Recommendation:** Establish a convention — user-facing errors in Vietnamese, system/operator errors in English — and document it.

### 14. `process.env` accessed directly in service code (trip-plans.service.ts:288, 341)

```ts
const parsed = Number(process.env.TRIP_PLANNER_MAX_CANDIDATES);
const parsed = Number(process.env.TRIP_PLANNER_MAX_OUTPUT_TOKENS);
```

These bypass NestJS's `ConfigService`, making testing harder and inconsistent with the rest of the codebase.

**Recommendation:** Inject `ConfigService` and read these values in the constructor, consistent with other services.

### 15. `sanitize-path.ts` and `sanitize.ts` exist but usage not verified globally

The common module contains sanitization utilities, but it's unclear if they are applied globally via middleware or only selectively. If selective, some endpoints may be missing sanitization.

**Recommendation:** Verify sanitization coverage via middleware or interceptor applied globally.

### 16. Admin controller doesn't validate `id` param format

```ts
@Patch(':id')
async update(@Param('id') id: string, ...)
```

If `id` is expected to be a UUID, a `@IsUUID()` `ParseUUIDPipe` should be applied to reject malformed IDs before they hit Prisma (which would throw a less-friendly error).

### 17. `AuditLogsService.record()` is fire-and-forget with `await`

In admin controllers, audit log recording is `await`ed but errors are not caught:

```ts
await this.audit.record({ ... });
```

If the audit log write fails (e.g., DB connection issue), the entire admin operation appears to fail even though the primary operation (create/update/delete) already succeeded.

**Recommendation:** Either make audit logging non-blocking (fire-and-forget with error logging), or wrap in try/catch so the primary response isn't affected.

### 18. `photos` field set to `undefined` after mapping (places.service.ts:203)

```ts
out.photos = undefined;
```

This mutates the return object to omit photos in list view. It would be cleaner to not include the field in the mapping function or use a separate DTO/mapper for list vs. detail views.

### 19. `JwtStrategy` extracts user role directly from JWT payload

The role is trusted from the JWT. If a user's role is changed (e.g., admin removes editor role), the old JWT remains valid with the old role until expiry. This is standard JWT behavior but worth noting.

**Recommendation:** For sensitive role changes, consider a short token TTL or a token revocation check.

---

## ✅ Strengths

| Area                         | Details                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Security layers**          | CORS, Helmet, CSRF origin check, Turnstile CAPTCHA, rate limiting (IP + fingerprint), input sanitization — defense in depth is excellent |
| **Rate limiting**            | Multi-layer: IP-based, fingerprint-based, and per-user quota for AI endpoints                                                            |
| **AI fallback**              | Trip planner gracefully falls back to a local deterministic plan when AI provider is unavailable                                         |
| **Audit logging**            | Admin operations are consistently audit-logged with actor, action, entity context                                                        |
| **S3 presigned URL caching** | Deduplication of concurrent signing requests via `pendingPresignedUrls` prevents thundering herd                                         |
| **PostGIS integration**      | Proper use of `ST_DWithin` with geography type and GIST index for spatial queries                                                        |
| **Multipart handling**       | Proper file size limits, type validation, buffer-level magic byte verification                                                           |
| **Error messages**           | Consistent Vietnamese localization for user-facing errors                                                                                |
| **Module organization**      | Clean NestJS module boundaries with proper dependency injection                                                                          |
| **Database**                 | Production-aware pooling check for Neon.tech connections                                                                                 |

---

## Recommended Priority Actions

1. **Add a global exception filter** to prevent leaking internal error details (Critical)
2. **Fix `process.env` direct access** — use `ConfigService` consistently (Low effort, high consistency)
3. **Extract `PUBLIC_PROVINCE` to shared config** for multi-province readiness (Medium)
4. **Add AI call timeouts** to prevent hung requests (High impact)
5. **Add `ParseUUIDPipe`** to admin ID parameters (Low effort)
6. **Make audit logging non-blocking** or error-tolerant (Medium)
7. **Use LRU cache** for presigned URL caching to bound memory (Medium)
8. **Normalize CORS origins** to lowercase (Low effort)

---

_Review performed on commit `17e0a8e` — 2026-07-06_

# Vivu — Tài liệu thiết kế kỹ thuật (DESIGN)

> Tài liệu này mô tả **thiết kế kỹ thuật chi tiết** của Vivu: kiến trúc, dữ liệu, API, bảo mật, hiệu năng, observability, và các quyết định lớn (ADR). Charter / phạm vi sản phẩm xem [`PROJECT.md`](./PROJECT.md). Tổng quan toàn diện cả product + engineering xem [`docs/overview.md`](./docs/overview.md).

---

## 1. Mục tiêu phi chức năng (NFRs)

| Hạng mục        | Mục tiêu                                                      |
| --------------- | ------------------------------------------------------------- |
| Hiệu năng (FE)  | LCP < 2.5s, INP < 200ms, CLS < 0.1 trên mobile 4G             |
| Hiệu năng (API) | p95 < 200ms cho GET hot, < 500ms cho search                   |
| Khả dụng        | 99.5% / tháng (MVP), 99.9% (v2)                               |
| Mở rộng         | 1.000 RPS đọc, 50 RPS ghi (sau caching)                       |
| Bảo mật         | OWASP Top 10, không lưu PII không cần, mọi secret được rotate |
| i18n            | vi/en first-class, thêm ngôn ngữ mới chỉ cần thêm bảng dịch   |
| Accessibility   | WCAG 2.1 AA cho các trang chính                               |
| Observability   | Trace + log + metric cho mọi request, alert error rate >1%    |

## 2. Kiến trúc tổng thể

### 2.1 Sơ đồ logic

```
            ┌──────────────────────────┐
            │       Người dùng         │
            └─────────────┬────────────┘
                          │ HTTPS
                ┌─────────▼─────────┐
                │   CDN (Cloudflare) │
                └─────────┬─────────┘
                          │
                ┌─────────▼──────────┐
                │   Next.js (web)    │
                │  SSR / ISR / SSG   │
                │  Route handlers    │
                └─────────┬──────────┘
                          │ REST + JWT
                ┌─────────▼──────────┐
                │   NestJS (api)     │
                │  Auth · Places ·   │
                │  Reviews · ...     │
                └─┬───────┬──────┬──┘
                  │       │      │
          ┌───────▼─┐ ┌───▼──┐ ┌─▼────────────┐
          │Postgres │ │Redis │ │ MeiliSearch  │
          │+PostGIS │ │      │ │              │
          └─────────┘ └──────┘ └──────────────┘
                  │
           ┌──────▼──────┐
           │  S3 / R2    │  ảnh
           └─────────────┘
```

### 2.2 Trách nhiệm

- **Next.js** rendering (SSR / ISR cho trang địa điểm, SSG cho trang tĩnh), proxy auth cookies, BFF cực mỏng cho 1 vài endpoint cần composition; **không** chứa business logic.
- **NestJS** là source of truth: business logic, validation, persistence, search index sync. **Không** lộ DB ra FE.
- **MeiliSearch** chỉ dùng cho search/typeahead; index từ Postgres qua job (BullMQ).
- **Redis** cache hot reads + rate-limit + queue.
- **Postgres** là DB chính. PostGIS cho geo, `pg_trgm` fallback search.
- **S3/R2** chỉ chứa media; ảnh upload trực tiếp từ FE qua presigned URL do API ký.

### 2.3 Phân lớp NestJS

```
HTTP layer        Controller (DTO in/out, swagger, guards)
   │
Application       Service (business logic, orchestrate)
   │
Domain            Entities & types (@vivu/types)
   │
Infrastructure    Prisma repository, search client, S3 client, queue
```

> Quy tắc: controller chỉ gọi service, service chỉ gọi repo/clients. Không cross-import giữa modules feature trừ qua public re-exports.

## 3. Stack & lý do (rút gọn)

| Layer         | Chọn                                      | Vì sao                                                        |
| ------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Web framework | Next.js 14 (App Router)                   | SSR/ISR mạnh, file-based router, tooling Vercel.              |
| API framework | NestJS 10 (Fastify adapter)               | Module hóa rõ, decorators, Swagger auto, DX tốt.              |
| ORM           | Prisma                                    | Type-safe, migration đơn giản, dev velocity cao.              |
| DB            | PostgreSQL 15 + PostGIS                   | Mạnh, mở, geo built-in.                                       |
| Search        | MeiliSearch                               | Tiếng Việt tốt, gọn, dễ vận hành; có thể đổi sang ES sau.     |
| Cache / queue | Redis + BullMQ                            | Phổ biến, tích hợp tốt với Nest.                              |
| Storage       | Cloudflare R2 (S3-compatible)             | Egress free, rẻ, CDN gắn liền.                                |
| Auth          | JWT (access ngắn) + refresh xoay (cookie) | Stateless cho API, an toàn cho web.                           |
| Maps          | Leaflet + OSM                             | Miễn phí, đủ cho MVP; có thể chuyển Mapbox khi cần style đẹp. |
| Mono-repo     | pnpm workspaces + Turborepo               | Build cache, chia package gọn.                                |
| CI            | GitHub Actions                            | Đi kèm GitHub, miễn phí cho repo public.                      |

## 4. Frontend design

### 4.0 Visual design language (tokens)

> **Source of truth**: `apps/web/tailwind.config.ts` + `apps/web/src/app/globals.css`. Bộ token này khớp với `vivu_discovery/DESIGN.md` (file thiết kế từ Stitch). Đổi token → đổi cả hai file đồng thời.

**Brand & style.** Personality: _curated, energetic, reliable_. Phong cách: **Minimalism + Corporate Modern** — whitespace nhiều, grid chặt, typography contrast cao, ảnh chất lượng cao làm chủ đạo. Primary "Brand Blue" `#0066CC` chỉ dùng cho CTA / active / brand marks để giữ uy lực chức năng.

**Color (Material Design 3, palette Vivu Discovery)** — biến CSS ở `globals.css`, alias Tailwind ở `tailwind.config.ts`. Light mode neutrals:

| Vai trò                | Hex       | Token Tailwind                 |
| ---------------------- | --------- | ------------------------------ |
| Background / Surface 0 | `#f8f9fa` | `bg-surface` / `bg-background` |
| Surface 1 (cards)      | `#ffffff` | `bg-surface-container-lowest`  |
| Surface 2              | `#f3f4f5` | `bg-surface-container-low`     |
| Primary (CTA)          | `#0066cc` | `bg-primary-container`         |
| Primary (brand mark)   | `#004e9f` | `bg-primary`                   |
| On-surface (text)      | `#191c1d` | `text-on-surface`              |
| On-surface variant     | `#414753` | `text-on-surface-variant`      |
| Outline                | `#727784` | `border-outline`               |
| Error                  | `#ba1a1a` | `bg-error`                     |

Dark mode hoán đổi toàn bộ qua `class="dark"` trên `<html>` — cùng utility, không refactor markup.

**Typography (1.25 scale, dual-font).**

| Style        | Font           | Size | Weight | Line-height | Letter-spacing | Tailwind          |
| ------------ | -------------- | ---- | ------ | ----------- | -------------- | ----------------- |
| `h1`         | Be Vietnam Pro | 48px | 700    | 1.2         | -0.02em        | `font-h1 text-h1` |
| `h2`         | Be Vietnam Pro | 32px | 700    | 1.3         | -0.01em        | `font-h2 text-h2` |
| `h3`         | Be Vietnam Pro | 24px | 600    | 1.4         | 0              | `font-h3 text-h3` |
| `body-lg`    | Inter          | 18px | 400    | 1.6         | 0              | `text-body-lg`    |
| `body-md`    | Inter          | 16px | 400    | 1.6         | 0              | `text-body-md`    |
| `label-caps` | Inter          | 12px | 600    | 1.0         | 0.05em         | `text-label-caps` |

**Be Vietnam Pro** cho headlines (đặc trưng Việt, tinh tế), **Inter** cho body + UI (legibility cao, neutral). Both via `next/font` (zero CLS).

**Layout & spacing.** Nhịp 8px. `container-max = 1280px`, gutter 24px, mobile margin 16px, desktop margin 40px, `section-gap = 80px` ("breathable" minimalist).

**Elevation.** Không dùng border mạnh — dùng ambient shadow blue-tinted: `shadow-premium` (`0 4px 20px rgba(0, 102, 204, 0.15)`) cho cards, `shadow-hover` (`0 8px 30px rgba(0, 102, 204, 0.2)` + scale 1.02) cho hover.

**Shape (border radius).** 4px (sm), 8px (DEFAULT, buttons/inputs), 12px (md), 16px (lg, content cards), 24px (xl), full (pill, search bar).

**Components.**

- **Button primary**: `bg-primary-container text-on-primary` solid, no border, rounded-DEFAULT (8px).
- **Button secondary**: transparent + 1px border primary.
- **Button ghost**: blue text only — dùng cho action ít quan trọng (e.g. "Xem bản đồ").
- **Card**: top-heavy layout với ảnh full-bleed, title h3, label/meta `text-label-caps`, `rounded-lg` (16px) + `shadow-premium`.
- **Input**: soft gray fill `bg-surface-container-low` không border ở idle, focus → bg trắng + border 2px primary.
- **Chip**: pill 100px-radius, `bg-primary-fixed` + `text-on-primary-fixed` cho category tags.
- **Search bar**: pill-shaped (rounded-full), backdrop-blur 20px khi sticky.

> Khi cần đổi token, sửa `globals.css` (CSS vars) cho cả light + dark đồng thời. Tailwind config chỉ là alias.

### 4.1 Routing (App Router)

```
/                        Trang chủ (SSG + ISR cho khối "nổi bật")
/kham-pha                Khám phá: chủ đề/vùng/mùa
/dia-diem/[slug]         Trang chi tiết (ISR, revalidate 5–15')
/ban-do                  Bản đồ toàn cục
/so-tay                  Sổ tay cá nhân (authenticated)
/so-tay/[id]             Chi tiết collection
/tai-khoan/...           Profile, settings
/admin/...               Editor/admin (RBAC)
```

- Đa ngôn ngữ qua `next-intl`: `/[locale]/...` với `vi` mặc định.
- Sitemap động `/sitemap.xml` build từ API.

### 4.2 Data fetching

- Server components dùng `fetch` với `next: { revalidate }`.
- Client interactive (favorites, review form) dùng **TanStack Query** với cookie-based auth.
- Form: **React Hook Form + Zod**.

### 4.3 State

- **Server state**: TanStack Query.
- **UI state nhỏ**: Zustand (theme, sidebar, modal).
- Không dùng global Redux.

### 4.4 i18n & SEO

- Mỗi địa điểm có `titleVi`, `titleEn`, `summaryVi`, `summaryEn`...
- `next-intl` cho strings UI.
- JSON-LD `TouristAttraction` ở trang chi tiết.
- `<meta>` Open Graph + ảnh OG động (`@vercel/og`).
- Sitemap chia nhỏ theo loại / vùng nếu > 50.000 URL.
- `robots.txt` whitelist crawl public, deny admin.

### 4.5 Bản đồ

- Leaflet load **dynamic import** (chỉ khi route bản đồ hoặc trang detail có map).
- Dùng `leaflet.markercluster` khi > 100 marker trong viewport.
- Tile: `https://{s}.tile.openstreetmap.org/...` (kèm attribution); nếu chuyển Mapbox sẽ chuyển tile URL trong 1 helper duy nhất.

### 4.6 Accessibility

- Mọi component shadcn/ui đã wrap Radix → có a11y mặc định.
- Test axe trong Playwright cho các trang chính.
- Contrast check trong Tailwind config (palette `brand-*` đảm bảo AA cho text trên nền trắng).

## 5. Backend design

### 5.1 Module layout

```
src/
├─ auth/              # đăng ký, login, refresh, OAuth Google
├─ users/             # profile, role
├─ places/            # CRUD đọc public, CRUD ghi admin
├─ categories/
├─ regions/
├─ media/             # presigned upload, image processing
├─ reviews/           # ghi review, moderation flag
├─ collections/       # sổ tay
├─ favorites/
├─ questions/         # Q&A
├─ search/            # đồng bộ Meili, query
├─ admin/             # endpoint riêng cho editor/admin
├─ common/            # guards, interceptors, filters, decorators
└─ main.ts
```

### 5.2 DTO & validation

- Mọi input qua `class-validator` + `class-transformer` (whitelist + forbidNonWhitelisted).
- Output dạng `{ data, meta?, error? }` chuẩn hoá qua interceptor.
- Lỗi theo [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807) qua exception filter.

### 5.3 Auth & RBAC

- **Access token**: JWT 15 phút, payload `{ sub, role, locale }`, ký HS256 với `JWT_ACCESS_SECRET`.
- **Refresh token**: opaque (random 256-bit) lưu hash trong DB + httpOnly Secure cookie SameSite=Lax. Xoay (rotate) mỗi lần refresh; phát hiện reuse → revoke toàn bộ session của user.
- OAuth Google qua Passport strategy → tạo/đăng nhập user, không lưu password.
- RBAC: `user` < `editor` < `admin`. Implement bằng `@Roles()` decorator + `RolesGuard`.

### 5.4 Rate limit

- Toàn cục: 120 req / phút / IP (Throttler + Redis store).
- Endpoint nhạy cảm: `auth/login`, `auth/register` 10 / phút / IP. `media/presign`: 30 / phút / user.
- Trả 429 với `Retry-After`.

### 5.5 Logging & error

- Pino JSON, request id (`x-request-id`), user id (nếu có), latency.
- Mức INFO mặc định; ERROR đẩy Sentry kèm context.
- Không log `password`, `token`, `Authorization`. Mask email khi log mass.

### 5.6 Job & queue

- **BullMQ** (Redis):
  - `search:index-place` — đồng bộ 1 place vào Meili sau khi tạo/sửa.
  - `media:thumbnail` — tạo thumbnail cho ảnh upload (sharp).
  - `email:send` — gửi xác thực, reset password.
- Worker chạy cùng API process (cho MVP), tách riêng khi scale.

## 6. Database design

### 6.1 Schema

Xem [`apps/api/prisma/schema.prisma`](./apps/api/prisma/schema.prisma). Các bảng chính: `User`, `Region`, `Category`, `Place`, `PlaceCategory`, `Review`, `ReviewLike`, `Question`, `Answer`, `Collection`, `CollectionItem`, `Favorite`.

### 6.2 Geo

- Hiện Prisma không hỗ trợ trực tiếp PostGIS `geography`. Bước đầu lưu `lat`/`lng` dạng `Float`.
- Migration thủ công thêm cột `geo geography(Point, 4326)` + GIST index, đồng bộ từ trigger update lat/lng.
- Query "nearby" dùng `ST_DWithin` qua `$queryRaw`.

### 6.3 Index & truy vấn nóng

| Truy vấn                   | Index                        |
| -------------------------- | ---------------------------- |
| List published theo region | `(regionId, status)`         |
| List mới cập nhật          | `(status, updatedAt)`        |
| Detail by slug             | `Place.slug` UNIQUE          |
| Search fallback (no Meili) | `pg_trgm` GIN trên `titleVi` |
| Reviews theo place         | `(placeId, createdAt)`       |
| Nearby (km)                | GIST trên `geo`              |

### 6.4 Migration

- Mỗi PR thay schema bắt buộc kèm migration Prisma (`prisma migrate dev` → commit).
- Production: `prisma migrate deploy` chạy trước khi rollout app version mới.
- Migration nguy hiểm (drop column, change type) phải có **2-phase** rollout (đọc cả cũ + mới → ngừng dùng cũ → drop).

### 6.5 Backup

- Snapshot daily, giữ 14 ngày.
- WAL streaming → bucket S3 (PITR 7 ngày).
- Test restore hàng tháng.

## 7. Search design

### 7.1 Index Meili

Index `places`:

```
{
  id, slug,
  titleVi, titleEn,
  summaryVi, summaryEn,
  region: { id, slug, nameVi, nameEn },
  categories: [{ id, slug, nameVi }],
  bestSeasons,
  status,
  popularity (computed),
  geo: { lat, lng }
}
```

- Searchable: `titleVi`, `titleEn`, `summaryVi`, `summaryEn`, `region.nameVi`.
- Filterable: `status`, `region.id`, `categories.id`, `bestSeasons`.
- Sortable: `popularity`, `updatedAt`.
- Stop-words tiếng Việt + synonyms ("đn" ↔ "đà nẵng", "sg" ↔ "sài gòn", "tphcm" ↔ "tp.hcm" ↔ "ho chi minh city").

### 7.2 Đồng bộ

- Khi tạo/sửa/đổi `status` Place → push job `search:index-place`.
- Khi xoá → `search:remove-place`.
- Reindex toàn bộ qua command `pnpm --filter @vivu/api search:reindex` (cho deploy mới hoặc đổi schema).

## 8. Caching strategy

| Layer       | Đối tượng                              | TTL               | Invalidate                     |
| ----------- | -------------------------------------- | ----------------- | ------------------------------ |
| CDN         | `/`, `/dia-diem/[slug]`, ảnh           | 5 phút (s-maxage) | tag-based khi place thay đổi   |
| Next.js ISR | trang chi tiết, list                   | revalidate 5–15'  | revalidatePath khi place sửa   |
| Redis       | `GET /places/:slug`, `regions`, `cats` | 10 phút           | xoá key khi mutation tương ứng |
| Browser     | static assets                          | 1 năm + hashed    | hash trong filename            |

## 9. Storage (media)

- Bucket private, serve qua CDN có signed URL cho ảnh hot, public-read cho ảnh đã duyệt.
- Upload flow:
  1. FE gọi `POST /media/presign` (yêu cầu mime + size + scope).
  2. API trả `{ uploadUrl, publicUrl, key }`.
  3. FE PUT trực tiếp lên S3/R2.
  4. FE gọi `POST /reviews` / `PATCH /places/:id` với `mediaId`.
  5. Worker `media:thumbnail` sinh các size 400/800/1600.
- Validate phía API: mime allow-list (`image/jpeg`, `image/png`, `image/webp`), max 10MB, kích thước max 8000×8000.
- Tên file random (cuid + ext), không tin client filename.

## 10. Bảo mật

- HTTPS bắt buộc, HSTS, redirect http→https ở edge.
- Helmet (Fastify) ở API + secure headers ở Next.js (`next.config` headers).
- CORS allow-list domain FE (`CORS_ORIGINS`).
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax`. CSRF: double-submit token cho ghi từ web.
- Validate mọi DTO. Không dùng `any` trong controller.
- Sanitize HTML markdown render (DOMPurify FE + sanitize-html BE khi cần).
- Rate limit (mục 5.4).
- Audit log mọi thao tác admin (bảng `AuditLog` thêm sau).
- Secrets: Doppler / 1Password CLI. `.env` không commit. Rotate JWT secret 6 tháng/lần.
- Dependency scan: `pnpm audit` trong CI; Renovate auto PR.
- 2FA cho admin (sẽ thêm ở v1.x).

## 11. Observability

- **Logs**: Pino JSON → Loki (staging/prod) hoặc CloudWatch.
- **Metrics**: Prometheus exporter (Nest interceptor) — request rate, latency p95, error rate, DB pool, Meili health.
- **Tracing**: OpenTelemetry (HTTP + Prisma instrumentation) → Tempo / Jaeger.
- **Errors**: Sentry FE + BE (source map upload trong CI).
- **Health**: `GET /healthz` liveness, `GET /readyz` readiness (check DB + Redis + Meili).
- **Alerts** (v1):
  - Error rate > 1% trong 5 phút.
  - p95 latency > 500ms trong 10 phút.
  - DB pool exhausted.
  - Worker queue backlog > 1.000 jobs.

## 12. Deployment topology

### 12.1 Môi trường

- `local` — dev (Docker compose).
- `staging` — preview, dữ liệu thử.
- `production` — thật.

### 12.2 Khuyến nghị

- **FE**: Vercel (đơn giản nhất cho Next.js).
- **API**: Fly.io / Render / Railway (1 region SG/HKG để gần user VN).
- **DB**: Neon hoặc Supabase Postgres (managed + PostGIS).
- **Redis**: Upstash Redis (serverless) hoặc tự host nhỏ.
- **MeiliSearch**: Meili Cloud hoặc tự host trên VPS 2GB.
- **Storage**: Cloudflare R2.
- **CDN**: Cloudflare cho cả ảnh + cache HTML.
- **Domain**: `vivu.app` (chưa mua) hoặc subdomain bạn có.

### 12.3 CI/CD

- PR → CI chạy lint/typecheck/build/test → preview deploy Vercel cho FE + Fly review app cho API.
- Merge `main` → auto deploy staging → smoke test → manual promote production.

## 13. ADR (Architecture Decision Records)

> Mỗi quyết định lớn ghi 1 mục ngắn: bối cảnh → quyết định → hệ quả. Khi có quyết định mới, append vào đây.

### ADR-001: Mono-repo với pnpm + Turborepo

- **Bối cảnh:** chia FE/BE/types nhưng vẫn chia sẻ types & tooling.
- **Quyết định:** mono-repo `apps/*` + `packages/*` với pnpm workspaces + Turborepo.
- **Hệ quả:** dùng `workspace:*` cho `@vivu/types`, build cache per-task, một `pnpm install` duy nhất.

### ADR-002: NestJS + Fastify thay vì Express

- **Bối cảnh:** chọn web framework BE.
- **Quyết định:** NestJS với platform-fastify.
- **Hệ quả:** module hóa & DX tốt; hiệu năng cao hơn Express; cần `pnpm.overrides` để pin fastify thống nhất với `@fastify/helmet`.

### ADR-003: Prisma thay vì TypeORM/Drizzle

- **Bối cảnh:** ORM cho TypeScript + Postgres.
- **Quyết định:** Prisma.
- **Hệ quả:** type-safe đỉnh, migration đơn giản; nhược điểm: PostGIS không first-class → dùng raw query cho geo.

### ADR-004: MeiliSearch thay vì Elasticsearch (MVP)

- **Bối cảnh:** cần search tiếng Việt nhanh, gọn.
- **Quyết định:** MeiliSearch cho MVP/v1; mở cửa chuyển ES nếu cần aggregations phức tạp.
- **Hệ quả:** vận hành dễ hơn nhiều, tiếng Việt tốt; thiếu một số tính năng aggregation nâng cao.

### ADR-005: Auth dùng JWT + refresh xoay

- **Bối cảnh:** stateless cho API + an toàn cho web.
- **Quyết định:** access JWT 15', refresh opaque httpOnly cookie xoay mỗi lần dùng.
- **Hệ quả:** đơn giản scale, có thể detect refresh reuse → invalidate session.

### ADR-006: Leaflet + OSM (MVP) thay vì Mapbox

- **Bối cảnh:** cần bản đồ tương tác.
- **Quyết định:** Leaflet + OpenStreetMap tiles cho MVP, có wrapper trong 1 helper.
- **Hệ quả:** miễn phí; nếu cần style đẹp hơn → đổi tile URL sang Mapbox/MapTiler trong helper, code map không phải sửa.

### ADR-007: Không dùng tRPC / GraphQL

- **Bối cảnh:** giao tiếp FE-BE.
- **Quyết định:** REST + Swagger.
- **Hệ quả:** dễ caching CDN, dễ public hóa API sau, SDK gen từ OpenAPI khi cần.

## 14. Performance budget

| Metric                         | Budget        |
| ------------------------------ | ------------- |
| JS gửi xuống trang detail (gz) | < 180 KB      |
| Ảnh hero LCP                   | < 200 KB AVIF |
| Số request critical render     | ≤ 30          |
| API GET hot p95                | < 200ms       |
| API search p95                 | < 500ms       |
| TTFB SSR (cached)              | < 100ms       |

PR vượt budget cần justify trong description.

## 15. Test strategy

### 15.1 Pyramid

- **Unit (BE):** service / util / formatter — Jest.
- **Integration (BE):** controller + Prisma + Postgres test (Testcontainers).
- **Unit/component (FE):** Vitest + Testing Library.
- **E2E:** Playwright cho:
  - Search → detail → favorite.
  - Đăng ký → đăng nhập → tạo collection → thêm place.
  - Viết review có ảnh.
  - Bản đồ: filter category, click marker.
- **A11y:** axe trong Playwright cho `/`, `/dia-diem/[slug]`, `/ban-do`.
- **Load:** k6 cho `GET /places` & `search/suggest` (gate 200 RPS / p95 200ms ở staging).

### 15.2 Test data

- Seed 100 địa điểm sample (Hạ Long, Đà Lạt, Hội An, Sa Pa, Phú Quốc, ...) qua `prisma/seed.ts`.
- Test DB riêng, reset giữa các test bằng truncate + reseed.

## 16. Open questions / TODO kỹ thuật

- [ ] Quyết định domain chính (`vivu.app` / `vivu.travel` / khác) → ảnh hưởng SEO & CSP.
- [ ] Chọn provider email transactional (Resend / Postmark).
- [ ] Có dùng Edge Runtime cho 1 vài route Next.js không? (lợi: nhanh, hại: thiếu API Node).
- [ ] Khi nào tách worker BullMQ ra process riêng? (đề xuất: khi RPS API > 20 hoặc job queue depth > 100).
- [ ] Chiến lược chống scrape ảnh (watermark? hot-link protection ở R2?).
- [ ] Public API read-only — rate-limit theo API key, có cần CAPTCHA ở v2?
- [ ] PWA: scope, asset cache, offline strategy cho địa điểm đã lưu.

---

## 17. Quy ước cập nhật DESIGN

- Mọi PR thay đổi kiến trúc / contract API / schema DB cần update tài liệu này trong cùng PR.
- Quyết định lớn → thêm ADR mới (mục 13). Không sửa ADR cũ; nếu thay đổi thì viết ADR mới "supersedes ADR-NNN".
- Tài liệu là **single source of truth** cho thiết kế; comment trong code chỉ giải thích chi tiết, không thay thế DESIGN.md.

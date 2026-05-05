# Web Du Lịch — Tài liệu tổng quan dự án

> Phạm vi: **Chỉ là portal tra cứu địa điểm du lịch.** Không có chức năng đặt phòng, đặt vé, thanh toán, OTA, hay bất kỳ giao dịch thương mại nào. Trọng tâm là **khám phá – tra cứu – lưu trữ – chia sẻ thông tin** về địa điểm du lịch.

- **Frontend:** Next.js (App Router, React 18, TypeScript)
- **Backend:** NestJS (TypeScript, REST + có thể mở rộng GraphQL)
- **Database:** PostgreSQL (+ PostGIS cho địa lý) + Redis (cache/search)
- **Search:** MeiliSearch hoặc Elasticsearch (typeahead, full-text tiếng Việt)
- **Storage:** S3-compatible (Cloudflare R2 / MinIO) cho ảnh
- **Maps:** Leaflet + OpenStreetMap (miễn phí) hoặc Mapbox (nếu cần style đẹp)

---

## 1. Mục tiêu sản phẩm

1. Cho phép người dùng **tra cứu nhanh** các địa điểm du lịch theo tên, vùng miền, loại hình (biển, núi, di tích, ẩm thực, làng nghề…).
2. Cung cấp **trang chi tiết phong phú** cho mỗi địa điểm: ảnh, mô tả, vị trí trên bản đồ, thời điểm đẹp nhất để đi, lưu ý, đánh giá cộng đồng.
3. Hỗ trợ **bản đồ tương tác** với cluster POI, lọc theo danh mục, vẽ tuyến tham khảo.
4. Cho phép user **đăng nhập, lưu địa điểm yêu thích, tạo danh sách ("Sổ tay du lịch") cá nhân**, viết review.
5. **Khám phá có chủ đích**: đề xuất theo mùa, theo vùng, theo chủ đề ("Top 10 bãi biển miền Trung"…).
6. Hiệu năng cao, mobile-first, đa ngôn ngữ (vi / en) — sẵn sàng SEO tốt cho khách quốc tế tra cứu Việt Nam.

**Không thuộc phạm vi (Out of scope):**

- Đặt khách sạn / vé máy bay / tour
- Thanh toán, ví, coupon, khuyến mãi thương mại
- Tích hợp GDS / OTA / nhà cung cấp inventory
- Quản lý kho phòng, giá động, booking orchestration
- Hóa đơn, escrow, tax/fee, hoàn hủy

---

## 2. Personas & User stories chính

### Personas

- **Khách du lịch tự túc (chính):** muốn nhanh chóng biết "đi đâu, có gì, đi vào lúc nào".
- **Người lập kế hoạch:** muốn lưu lại danh sách điểm sẽ đi, sắp xếp theo ngày/tuyến.
- **Cộng đồng đóng góp:** muốn viết review, gợi ý điểm mới, chia sẻ ảnh.
- **Admin/Editor:** quản lý nội dung, kiểm duyệt review, gắn nhãn, cập nhật thông tin.

### User stories tiêu biểu

- "Là khách du lịch, tôi muốn gõ 'Đà Lạt' và thấy ngay danh sách điểm nổi bật + bản đồ."
- "Là người dùng, tôi muốn lọc các điểm theo tỉnh, theo loại (biển/núi/di tích), theo mùa."
- "Là người dùng đã đăng nhập, tôi muốn lưu một địa điểm vào 'Sổ tay miền Tây 2026'."
- "Là người dùng, tôi muốn viết review 1–5 sao, kèm ảnh, cho một địa điểm."
- "Là editor, tôi muốn duyệt review mới và ẩn review vi phạm."

---

## 3. Tính năng chi tiết

### 3.1 Tra cứu & tìm kiếm

- Thanh tìm kiếm **typeahead** (gợi ý theo tên địa điểm, tỉnh/thành, danh mục).
- **Full-text search** tiếng Việt có dấu / không dấu (dùng MeiliSearch hoặc analyzer Elastic).
- **Faceted filters:** tỉnh/thành, vùng miền, loại địa điểm, mùa đẹp, mức độ phổ biến.
- **Sort:** liên quan, đánh giá cao nhất, mới cập nhật, gần tôi nhất (geo).

### 3.2 Trang chi tiết địa điểm

- Hero gallery (ảnh chất lượng cao, lazy-load, blur placeholder).
- Tiêu đề, vị trí (tỉnh/huyện), tags danh mục.
- Mô tả dài (rich text — render từ Markdown/MDX).
- **Khối thông tin nhanh:** thời điểm lý tưởng, thời tiết tham khảo, độ khó tiếp cận, gợi ý phương tiện.
- **Bản đồ nhúng** (Leaflet) ghim tọa độ + các điểm lân cận.
- Reviews & rating cộng đồng.
- Q&A đơn giản (hỏi đáp công khai).
- Các điểm liên quan ("Gần đây", "Cùng chủ đề").

### 3.3 Khám phá / Discovery

- Trang chủ với các khối: **Nổi bật mùa này**, **Theo vùng miền**, **Chủ đề** (Biển, Núi, Di tích, Ẩm thực, Làng nghề, Trekking).
- Bài viết tổng hợp (editorial) dạng "Top 10 …" — render từ Markdown trong CMS.
- Trang theo tỉnh/thành, theo danh mục.

### 3.4 Bản đồ tương tác

- Bản đồ toàn cục hiển thị tất cả POI với **clustering**.
- Filter sidebar (danh mục, tỉnh, rating).
- Click marker → popup nhanh → link sang trang chi tiết.
- Geolocation: "Gần tôi" (xin quyền trình duyệt).

### 3.5 Tài khoản người dùng

- Đăng ký / đăng nhập email + Google OAuth.
- Hồ sơ cá nhân (avatar, bio).
- **Yêu thích (Favorites):** lưu địa điểm đã thích.
- **Sổ tay (Collections):** tạo nhiều list, đặt tên, mô tả, public/private.
- Lịch sử xem gần đây.

### 3.6 Review & Q&A cộng đồng

- Review: rating 1–5, text, ảnh (tối đa N ảnh), tự động gắn timestamp.
- Hệ thống **like / hữu ích** cho review.
- Báo cáo nội dung không phù hợp.
- Q&A: hỏi công khai, người khác (hoặc editor) trả lời.

### 3.7 Khu vực Admin / Editor

- Quản lý địa điểm (CRUD): tên, mô tả, ảnh, tọa độ, danh mục, tags.
- Quản lý danh mục, vùng miền, chủ đề.
- Duyệt review, ẩn/xóa nội dung vi phạm.
- Quản lý người dùng (khóa/mở).
- Dashboard số liệu: lượt xem, top địa điểm, tăng trưởng review.

### 3.8 Đa ngôn ngữ & SEO

- i18n: vi (mặc định), en.
- Mỗi địa điểm có bản dịch (title, description, tags) — fallback về vi.
- SEO: meta tags, Open Graph, JSON-LD `TouristAttraction`, sitemap.xml động, robots.txt, ảnh OG tự generate.
- Static rendering / ISR cho các trang địa điểm để LCP nhanh.

---

## 4. Kiến trúc tổng thể

```
                ┌─────────────────────────┐
                │        Người dùng       │
                └───────────┬─────────────┘
                            │ HTTPS
                ┌───────────▼─────────────┐
                │   CDN (Cloudflare)      │
                └───────────┬─────────────┘
                            │
                ┌───────────▼─────────────┐
                │   Next.js (Vercel /     │
                │   self-host Node)       │
                │  - SSR / ISR / SSG      │
                │  - API proxy /BFF nhẹ   │
                └───────────┬─────────────┘
                            │ REST (HTTPS, JWT)
                ┌───────────▼─────────────┐
                │      NestJS API         │
                │  - Auth, Places, Search │
                │  - Reviews, Collections │
                │  - Admin                │
                └─────┬───────┬───────┬───┘
                      │       │       │
              ┌───────▼─┐ ┌───▼───┐ ┌─▼──────────┐
              │Postgres │ │ Redis │ │ MeiliSearch│
              │+PostGIS │ │ cache │ │  (search)  │
              └─────────┘ └───────┘ └────────────┘
                      │
              ┌───────▼─────────┐
              │ S3 / R2 (ảnh)   │
              └─────────────────┘
```

- **Frontend (Next.js)** chịu trách nhiệm render (SSR cho trang động, ISR cho trang địa điểm, SSG cho trang tĩnh), gọi NestJS qua REST. Ảnh phục vụ qua `next/image` + CDN.
- **Backend (NestJS)** là nguồn sự thật. Module hóa rõ ràng. Không lộ DB ra FE.
- **Search service** là MeiliSearch (đơn giản, tiếng Việt tốt) — index từ Postgres qua job.
- **Cache**: Redis cho session (nếu dùng), rate-limit, cache truy vấn hot.
- **Storage**: ảnh upload → backend ký URL (presigned) → FE upload thẳng lên S3/R2.

---

## 5. Stack chi tiết

### 5.1 Frontend — Next.js

- **Next.js 14+** (App Router), **React 18**, **TypeScript**.
- **UI:** TailwindCSS + shadcn/ui (Radix). Có thể bổ sung Framer Motion cho hiệu ứng nhẹ.
- **State:** TanStack Query (server state) + Zustand (UI state nhỏ).
- **Form:** React Hook Form + Zod.
- **Map:** `react-leaflet` + `leaflet.markercluster`.
- **i18n:** `next-intl`.
- **Auth client:** NextAuth.js hoặc gọi trực tiếp NestJS (JWT lưu trong httpOnly cookie qua route handler của Next).
- **Image:** `next/image`, loader trỏ về CDN R2.
- **Testing:** Vitest + Testing Library + Playwright (E2E).
- **Lint:** ESLint + Prettier + TypeScript strict.

Cấu trúc thư mục đề xuất:

```
apps/web
├─ app/
│  ├─ (marketing)/
│  ├─ (app)/
│  │  ├─ kham-pha/
│  │  ├─ dia-diem/[slug]/
│  │  ├─ ban-do/
│  │  ├─ so-tay/
│  │  └─ tai-khoan/
│  ├─ api/            # route handlers (BFF nhẹ, proxy)
│  └─ layout.tsx
├─ components/
├─ features/
│  ├─ search/
│  ├─ places/
│  ├─ map/
│  ├─ collections/
│  └─ reviews/
├─ lib/ (api client, auth, i18n)
├─ messages/ (vi.json, en.json)
└─ public/
```

### 5.2 Backend — NestJS

- **NestJS 10+**, TypeScript, Fastify adapter (nhanh hơn Express).
- **ORM:** Prisma (DX tốt) hoặc TypeORM. Khuyến nghị **Prisma**.
- **DB:** PostgreSQL 15 + extension **PostGIS** (geo) + **pg_trgm** (fuzzy search backup).
- **Auth:** JWT access (15') + refresh token (rotate), bcrypt cho password, Passport strategies.
- **Validation:** `class-validator` + `class-transformer` (hoặc Zod qua pipe tùy chọn).
- **Docs:** Swagger (`@nestjs/swagger`) tự sinh OpenAPI.
- **Queue/Jobs:** BullMQ + Redis (đẩy index search, gửi email xác thực, sinh thumbnail).
- **Logging:** Pino + request id; tích hợp OpenTelemetry → Grafana Tempo / Loki.
- **Rate limit:** `@nestjs/throttler` + Redis store.
- **Testing:** Jest (unit) + Supertest (e2e).

Module layout:

```
apps/api/src
├─ auth/
├─ users/
├─ places/
├─ categories/
├─ regions/
├─ media/         # upload, presigned URL
├─ reviews/
├─ collections/
├─ search/        # đồng bộ với Meili
├─ admin/
├─ common/        # guards, interceptors, filters
└─ main.ts
```

### 5.3 DevOps & hạ tầng

- **Mono-repo** với `pnpm` workspaces + **Turborepo** (apps/web, apps/api, packages/ui, packages/types).
- **CI:** GitHub Actions — lint, test, build, e2e (Playwright), preview deploy.
- **Container:** Docker multi-stage cho cả web & api.
- **Deploy:**
  - FE: Vercel (đơn giản nhất cho Next.js) hoặc tự host trên VPS.
  - BE: VPS / Fly.io / Render / Railway. DB Postgres managed (Neon, Supabase, RDS).
- **Observability:** Sentry (FE+BE), Grafana + Prometheus, Uptime Kuma.
- **Secrets:** Doppler hoặc `.env` + 1Password. Không commit secrets.

---

## 6. Mô hình dữ liệu (rút gọn)

```
User(id, email, password_hash, name, avatar_url, role[user|editor|admin], locale, created_at)

Region(id, slug, name_vi, name_en, parent_id)         # vùng/miền/tỉnh/huyện
Category(id, slug, name_vi, name_en, icon)            # biển, núi, di tích, ẩm thực...

Place(
  id, slug,
  title_vi, title_en,
  summary_vi, summary_en,
  description_vi, description_en,        # markdown
  region_id, address,
  geo (POINT, PostGIS),
  best_season (enum/array),
  difficulty, accessibility_notes,
  hero_image_id,
  status[draft|published|archived],
  created_by, created_at, updated_at
)

PlaceCategory(place_id, category_id)     # M-N

Media(id, place_id?, url, width, height, alt_vi, alt_en, uploaded_by, created_at)

Review(id, place_id, user_id, rating(1..5), content, status[visible|hidden|reported], created_at)
ReviewMedia(review_id, media_id)
ReviewLike(review_id, user_id)

Question(id, place_id, user_id, content, created_at)
Answer(id, question_id, user_id, content, created_at)

Collection(id, user_id, name, description, is_public, cover_image_id, created_at)
CollectionItem(collection_id, place_id, position, note)

Favorite(user_id, place_id, created_at)

AuditLog(id, actor_id, action, entity, entity_id, payload, created_at)
```

Index gợi ý:

- `Place.geo` GIST (PostGIS).
- `Place.title_vi` GIN trigram cho fallback search.
- Composite `(region_id, status)`, `(status, updated_at desc)`.

---

## 7. API (REST, ví dụ)

```
# Public
GET    /api/v1/places                  ?q=&region=&category=&season=&page=&sort=
GET    /api/v1/places/:slug
GET    /api/v1/places/:slug/reviews
GET    /api/v1/places/nearby           ?lat=&lng=&radius=
GET    /api/v1/categories
GET    /api/v1/regions
GET    /api/v1/search/suggest          ?q=          # typeahead

# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me

# User actions
POST   /api/v1/places/:id/favorite
DELETE /api/v1/places/:id/favorite
GET    /api/v1/me/favorites

POST   /api/v1/places/:id/reviews
PATCH  /api/v1/reviews/:id
DELETE /api/v1/reviews/:id

GET    /api/v1/me/collections
POST   /api/v1/collections
PATCH  /api/v1/collections/:id
DELETE /api/v1/collections/:id
POST   /api/v1/collections/:id/items
DELETE /api/v1/collections/:id/items/:placeId

# Media
POST   /api/v1/media/presign           # trả về URL upload tới S3/R2

# Admin (role: admin/editor)
POST   /api/v1/admin/places
PATCH  /api/v1/admin/places/:id
DELETE /api/v1/admin/places/:id
POST   /api/v1/admin/places/:id/publish
GET    /api/v1/admin/reviews?status=reported
PATCH  /api/v1/admin/reviews/:id/hide
```

Mọi response dùng JSON chuẩn `{ data, meta, error }`. Lỗi theo `Problem Details` (RFC 7807).

---

## 8. Bảo mật

- HTTPS bắt buộc, HSTS.
- JWT access ngắn hạn + refresh xoay (rotate) lưu httpOnly + Secure cookie.
- CSRF: dùng SameSite=Lax + double-submit token cho action ghi từ trình duyệt.
- Rate-limit theo IP + theo user (đặc biệt: `auth/*`, `reviews`, `media/presign`).
- Validate mọi input (DTO + class-validator), allow-list field cho update.
- Sanitize HTML/Markdown render (DOMPurify ở FE, server cũng strip script).
- RBAC rõ ràng: `user`, `editor`, `admin`.
- Audit log cho mọi thao tác admin.
- Không log password/token. Mask PII.
- Upload ảnh: kiểm tra mime, kích thước, scan extension; lưu tên ngẫu nhiên; serve qua CDN.

---

## 9. Hiệu năng & SEO

- **ISR** cho trang địa điểm (revalidate 5–15 phút), SSG cho landing/chủ đề.
- `next/image` + AVIF/WebP, ảnh đa kích thước.
- Code splitting theo route, dynamic import bản đồ (Leaflet) — chỉ load khi cần.
- Cache TanStack Query 60s cho list, stale-while-revalidate.
- Cache phía API: Redis cho `GET /places/:slug`, `categories`, `regions`.
- Web Vitals mục tiêu: LCP < 2.5s, CLS < 0.1, INP < 200ms (mobile 4G).
- SEO: sitemap động (`/sitemap.xml`), `next-seo` cho meta, JSON-LD `TouristAttraction`, breadcrumbs.
- OG image động (`@vercel/og`) cho mỗi địa điểm.

---

## 10. Testing

- **Unit (BE):** Jest cho service/util — coverage ≥ 70% lõi.
- **Integration (BE):** Supertest + DB test (Testcontainers Postgres).
- **Unit (FE):** Vitest + Testing Library cho component.
- **E2E:** Playwright các flow chính:
  - Tìm kiếm → mở chi tiết → lưu yêu thích.
  - Đăng ký → đăng nhập → tạo collection → thêm địa điểm.
  - Viết review có ảnh.
  - Bản đồ: filter danh mục, click marker.
- **Accessibility:** axe trên các trang chính.
- **Load test:** k6 cho `GET /places` và `search/suggest`.

---

## 11. Quan sát & vận hành

- Logs: Pino JSON → Loki / CloudWatch.
- Metrics: Prometheus (request rate, latency p95, error rate, DB pool).
- Tracing: OpenTelemetry → Tempo/Jaeger.
- Error tracking: Sentry FE + BE, source map upload trong CI.
- Health check: `/healthz` (liveness), `/readyz` (kèm check DB/Redis).
- Backup: Postgres daily snapshot + WAL; thử restore định kỳ.
- Runbook: deploy, rollback, xử lý spam review, xử lý abuse.

---

## 12. Lộ trình triển khai (gợi ý)

### MVP (4–6 tuần)

- Schema DB + seed dữ liệu mẫu (~100 địa điểm Việt Nam).
- Auth (email + Google).
- Trang chủ, tìm kiếm cơ bản, danh sách & chi tiết địa điểm.
- Bản đồ tương tác đơn giản.
- Yêu thích (favorites).
- Admin CRUD địa điểm tối thiểu.
- Deploy staging.

### v1 (4 tuần tiếp)

- Reviews + ảnh.
- Collections / Sổ tay.
- Search nâng cao (Meili) + typeahead.
- i18n vi/en.
- SEO đầy đủ + sitemap + JSON-LD.
- Observability cơ bản.

### v1.x (sau khi có traffic)

- Q&A.
- Editorial (bài viết tổng hợp theo chủ đề) qua MDX/CMS.
- Đề xuất theo mùa / theo lịch sử xem.
- PWA (offline xem địa điểm đã lưu).
- Tối ưu hiệu năng theo dữ liệu thực tế.

### v2 (mở rộng, vẫn không thương mại)

- Đóng góp địa điểm từ cộng đồng (UGC) có duyệt.
- Heatmap, route preview giữa các điểm (chỉ tham khảo).
- API public read-only cho nhà phát triển khác.

---

## 13. Định nghĩa "Done" (Definition of Done)

Một feature được coi là Done khi:

- Có DTO, validation, test unit/integration ở BE.
- Có UI responsive (mobile-first), state loading/empty/error.
- Có test E2E cho happy path.
- Có log + metric phù hợp.
- Đã pass CI (lint, type-check, test, build).
- Đã review code và deploy staging, QA xác nhận.
- Có cập nhật docs nếu thay đổi public API.

---

## 14. Quy ước & chất lượng code

- Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Branch: `feat/xxx`, `fix/xxx`, PR nhỏ, mô tả rõ.
- TS strict, không dùng `any`. Public API có JSDoc.
- ESLint + Prettier áp dụng trên cả FE và BE.
- Pre-commit (Husky + lint-staged): format + lint + type-check nhanh.
- Mỗi PR phải có test cho code mới (trừ thay đổi tài liệu/UI thuần).

---

## 15. Tóm tắt

Đây là **portal tra cứu địa điểm du lịch thuần túy**: người dùng tìm – xem – lưu – đánh giá – chia sẻ. Không có yếu tố thương mại. Stack hiện đại, gọn (Next.js + NestJS + Postgres/PostGIS + Meili + Redis + S3), tách biệt FE/BE rõ ràng, có lộ trình MVP → v1 → v2 dễ kiểm soát. Trọng tâm chất lượng: **tìm kiếm nhanh, dữ liệu sạch, trang chi tiết phong phú, bản đồ mượt, SEO tốt, đa ngôn ngữ.**

# Vivu

Vivu là nền tảng tra cứu địa danh và hỗ trợ du lịch Gia Lai. Hệ thống cung cấp
danh sách địa điểm, bản đồ, tìm kiếm, đánh giá, sổ tay và trợ lý AI nhận câu hỏi
hoặc hình ảnh địa danh.

- Web production: <https://vivu-web.vercel.app>
- API production: <https://vivu-api.vercel.app>
- Swagger local: <http://localhost:4000/docs>

## Phạm vi hiện tại

- Dữ liệu hiển thị trên web lấy từ PostgreSQL, không hard-code ở frontend.
- S3 lưu ảnh riêng tư; backend tạo presigned URL trước khi trả cho web.
- Qdrant Cloud chỉ dùng truy xuất ngữ cảnh cho AI, không phải database hiển thị.
- Gemini và Qdrant chỉ được gọi từ backend; API key không xuất hiện ở frontend.
- Backend không chạy embedding local và không tạo lại collection Qdrant.
- Giao diện công khai chỉ hiển thị địa danh thuộc phạm vi Gia Lai của dự án.

## Công nghệ

| Thành phần       | Công nghệ                                                          |
| ---------------- | ------------------------------------------------------------------ |
| Frontend         | Next.js 15, React 18, TypeScript, Tailwind CSS, next-intl, Leaflet |
| Backend          | NestJS 11, Fastify, Prisma                                         |
| Dữ liệu          | PostgreSQL, PostGIS                                                |
| Tìm kiếm         | Meilisearch, có fallback PostgreSQL                                |
| Lưu trữ ảnh      | AWS S3                                                             |
| AI retrieval     | Qdrant Cloud Inference                                             |
| Sinh câu trả lời | Google Gemini                                                      |
| Monorepo         | pnpm workspaces, Turborepo                                         |

## Cấu trúc

```text
vivu/
├─ apps/
│  ├─ api/                 # NestJS API
│  └─ web/                 # Next.js web
├─ packages/
│  └─ types/               # Kiểu dữ liệu dùng chung
├─ docs/                   # Tài liệu dự án
├─ docker-compose.yml
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Chạy local

Yêu cầu:

- Node.js 20 trở lên
- pnpm 9
- Docker

```bash
pnpm install
docker compose up -d db meilisearch
```

Tạo file môi trường:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Điền các biến bắt buộc trong hai file vừa tạo, sau đó chuẩn bị database và chạy
ứng dụng:

```bash
pnpm --filter @vivu/api db:setup
pnpm --filter @vivu/api prisma:generate
pnpm dev
```

Các địa chỉ local:

- Web: <http://localhost:3000>
- API: <http://localhost:4000/api/v1>
- Swagger: <http://localhost:4000/docs>

## Biến môi trường

Không commit file `.env` hoặc khóa thật lên Git.

Backend cần các nhóm biến sau:

- PostgreSQL: `DATABASE_URL`
- Auth: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
  `AWS_BUCKET_NAME`
- Qdrant: `QDRANT_URL`, `QDRANT_API_KEY` và tên collection/model
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`
- AI hardening: `AI_DAILY_QUOTA_ANON`, `AI_DAILY_QUOTA_USER`,
  `AI_CHAT_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_MINUTE`, `AI_MAX_IMAGE_SIZE_BYTES`
- Abuse hardening: `GLOBAL_RATE_LIMIT_PER_MINUTE`, `ABUSE_HASH_SECRET`,
  `DATA_REPORT_RATE_LIMIT_PER_HOUR`, `AUTH_RATE_LIMIT_PER_15_MIN`,
  `SEARCH_RATE_LIMIT_PER_MINUTE`, `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`
- Business MVP: `TRIP_PLANNER_DAILY_QUOTA_ANON`, `TRIP_PLANNER_DAILY_QUOTA_USER`,
  `TRIP_PLANNER_RATE_LIMIT_PER_MINUTE`, `LEADS_RATE_LIMIT_PER_HOUR`
- Timeout provider: `QDRANT_TIMEOUT_MS`, `GEMINI_TIMEOUT_MS`, `GEMINI_MAX_OUTPUT_TOKENS`
- Auth hardening: `AUTH_LOGIN_MAX_FAILURES`, `AUTH_LOGIN_LOCKOUT_WINDOW_MS`
- Tùy chọn: Meilisearch, CORS, cache TTL, CSP, Sentry và giới hạn cache

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_IMAGE_REMOTE_HOSTS=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
CSP_CONNECT_SRC_EXTRA=
CSP_IMG_SRC_EXTRA=
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

`NEXT_IMAGE_REMOTE_HOSTS` là danh sách hostname cho `next/image`, phân tách bằng dấu
phẩy, ví dụ
`res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com`.
Môi trường development vẫn có fallback rộng để không phá dữ liệu local; production nên
set rõ host ảnh đang dùng.

Danh sách đầy đủ nằm tại
[`apps/api/.env.example`](apps/api/.env.example) và
[`apps/web/.env.example`](apps/web/.env.example).

## Đồng bộ dữ liệu

Database là nguồn dữ liệu chính cho giao diện. Có thể đồng bộ thư mục địa danh
từ S3 và cập nhật tọa độ bằng các lệnh:

```bash
pnpm --filter @vivu/api sync:locations
pnpm --filter @vivu/api sync:coordinates
pnpm --filter @vivu/api reindex:meili
```

Script đồng bộ S3 dùng `locationKey` để upsert, lấy ảnh đại diện và phần giới
thiệu ngắn từ tài liệu địa danh. Script không tạo embedding và không thay đổi
collection Qdrant.

## API chính

```text
GET  /api/v1/places
GET  /api/v1/places/nearby
GET  /api/v1/places/:slug
GET  /api/v1/places/:slug/images
GET  /api/v1/categories
GET  /api/v1/regions
GET  /api/v1/search/suggest
POST /api/v1/ai/chat
POST /api/v1/trip-plans/generate
GET  /api/v1/trip-plans
POST /api/v1/trip-plans/:id/save-to-collection
POST /api/v1/leads
GET  /api/v1/admin/leads
POST /api/v1/data-reports
GET  /api/v1/admin/data-reports
POST /api/v1/analytics/events
```

`POST /api/v1/ai/chat` nhận `multipart/form-data` với `message`,
`session_id` và/hoặc `image`; hỗ trợ text-only, image-only và image + text.

Business MVP:

- Homepage và navigation public đã đưa rõ luồng lập lịch trình AI và tư vấn chuyến đi.
- `/lich-trinh` tạo lịch trình AI dựa trên địa danh trong database Vivu.
- `/tu-van` thu lead tư vấn từ home, detail, AI Chat và Trip Planner.
- `/admin/leads` giúp admin xem lead, mở chi tiết, copy phone/Zalo, đổi trạng thái và ghi chú nội bộ.
- `/admin/bao-loi` giúp admin xử lý báo lỗi dữ liệu từ người dùng.
- Trang chi tiết địa danh có nút báo lỗi dữ liệu, CTA bản đồ/lịch trình cho địa điểm gần đó.

## Kiểm tra chất lượng

Trong môi trường fresh install/CI, chạy Prisma generate trước typecheck/build để bảo
đảm Prisma Client đã sẵn sàng. Root `pnpm typecheck` đã tự chạy bước này, nhưng có thể
chạy riêng khi cần debug:

```bash
pnpm --filter @vivu/api prisma:generate
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vivu/api test
pnpm --filter @vivu/api test:int
```

Integration test dùng Testcontainers nên cần Docker đang chạy.

## Tài liệu

- [Tổng quan kiến trúc](docs/overview.md)
- [Phạm vi và quy ước dự án](docs/PROJECT.md)
- [Trạng thái triển khai](docs/PROGRESS.md)
- [Thiết kế hệ thống](docs/DESIGN.md)
- [Triển khai AI](docs/AI_DEPLOYMENT.md)
- [Security hardening](docs/SECURITY.md)
- [Business MVP](docs/BUSINESS_MVP.md)
- [Deploy checklist](docs/DEPLOY_CHECKLIST.md)

## Quy ước an toàn

- Giữ nguyên logo và brand name Vivu.
- Không đưa khóa AWS, Qdrant hoặc Gemini vào frontend.
- Không gọi trực tiếp S3, Qdrant hoặc Gemini từ trình duyệt.
- Không dùng Qdrant làm nguồn dữ liệu hiển thị chính.
- Không commit `.env`, token, presigned URL hoặc dữ liệu nhạy cảm.

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
| Frontend         | Next.js 14, React 18, TypeScript, Tailwind CSS, next-intl, Leaflet |
| Backend          | NestJS 10, Fastify, Prisma                                         |
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
  `AI_RATE_LIMIT_PER_MINUTE`, `AI_QUOTA_HASH_SECRET`, `AI_MAX_IMAGE_SIZE_BYTES`
- Business MVP: `TRIP_PLANNER_DAILY_QUOTA_ANON`, `TRIP_PLANNER_DAILY_QUOTA_USER`,
  `LEADS_RATE_LIMIT_PER_HOUR`
- Timeout provider: `QDRANT_TIMEOUT_MS`, `GEMINI_TIMEOUT_MS`, `GEMINI_MAX_OUTPUT_TOKENS`
- Auth hardening: `AUTH_LOGIN_MAX_FAILURES`, `AUTH_LOGIN_LOCKOUT_WINDOW_MS`
- Tùy chọn: Meilisearch, CORS, cache TTL, CSP, Sentry và giới hạn cache

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CSP_CONNECT_SRC_EXTRA=
CSP_IMG_SRC_EXTRA=
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

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
POST /api/v1/analytics/events
```

`POST /api/v1/ai/chat` nhận `multipart/form-data` với `message`,
`session_id` và/hoặc `image`; hỗ trợ text-only, image-only và image + text.

Business MVP:

- `/lich-trinh` tạo lịch trình AI dựa trên địa danh trong database Vivu.
- `/tu-van` thu lead tư vấn từ home, detail, AI Chat và Trip Planner.
- `/admin/leads` giúp admin xem lead, đổi trạng thái và ghi chú nội bộ.
- Trang chi tiết địa danh có nút báo lỗi dữ liệu gửi về backend.

## Kiểm tra chất lượng

```bash
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

## Quy ước an toàn

- Giữ nguyên logo và brand name Vivu.
- Không đưa khóa AWS, Qdrant hoặc Gemini vào frontend.
- Không gọi trực tiếp S3, Qdrant hoặc Gemini từ trình duyệt.
- Không dùng Qdrant làm nguồn dữ liệu hiển thị chính.
- Không commit `.env`, token, presigned URL hoặc dữ liệu nhạy cảm.

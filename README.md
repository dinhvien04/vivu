# Vivu

Vivu là nền tảng du lịch AI hỗ trợ khám phá địa danh, xem bản đồ, hỏi đáp bằng văn bản/hình ảnh, tạo lịch trình du lịch và gửi yêu cầu tư vấn. Dữ liệu hiện tập trung trong phạm vi **Gia Lai mới**, bao gồm Gia Lai và Bình Định cũ theo scope dữ liệu Vivu.

Dự án ưu tiên dữ liệu địa danh, ảnh, tọa độ, bản đồ và AI/RAG. PostgreSQL là nguồn dữ liệu hiển thị chính; Qdrant Cloud và Gemini chỉ được backend dùng để truy xuất ngữ cảnh và tạo phản hồi AI.

## Demo

- Web production: <https://vivu-web.vercel.app>
- API production: <https://vivu-api.vercel.app>
- Web build info: <https://vivu-web.vercel.app/build-info>
- API build info: <https://vivu-api.vercel.app/api/v1/build-info>
- Swagger local: <http://localhost:4000/docs>

## Screenshots

> TODO: cập nhật ảnh chụp giao diện production.

Repo hiện chưa có screenshot thật, nên README chưa nhúng ảnh để tránh link gãy. Placeholder nằm tại `docs/screenshots/`.

## Tính Năng Chính

- Khám phá địa danh du lịch Gia Lai/Bình Định cũ theo scope dữ liệu Vivu.
- Xem bản đồ, tọa độ và các địa điểm gần vị trí chọn.
- Tìm kiếm địa danh bằng Meilisearch, fallback PostgreSQL khi search engine chưa sẵn sàng.
- Hỏi Vivu AI bằng text-only, image-only hoặc image + text.
- Tạo lịch trình du lịch bằng AI từ dữ liệu địa danh trong database.
- Gửi yêu cầu tư vấn chuyến đi cho admin.
- Báo lỗi dữ liệu địa danh để đội vận hành kiểm tra.
- Admin quản lý lead, báo lỗi dữ liệu, nội dung địa danh, ảnh và review.
- Bảo vệ form public bằng Turnstile, rate limit/quota và role guard.

## Phạm Vi Hiện Tại

- Giao diện công khai ưu tiên địa danh thuộc phạm vi Gia Lai mới, bao gồm Gia Lai và Bình Định cũ theo scope dữ liệu Vivu.
- Backend/database là nguồn dữ liệu chính cho web hiển thị địa danh, ảnh, tọa độ, review, lead và báo lỗi dữ liệu.
- S3 lưu ảnh riêng tư; backend tạo presigned URL trước khi trả về frontend.
- Qdrant Cloud chỉ dùng để retrieval context cho AI, không dùng làm database hiển thị chính.
- Gemini/Qdrant/AWS chỉ được gọi từ backend; frontend không chứa API key và không gọi trực tiếp các dịch vụ này.
- Backend không chạy embedding local, không import BGE-M3/SigLIP/Transformers/Torch/FlagEmbedding và không tự tạo lại Qdrant collection.

## Công Nghệ

| Phần     | Công nghệ                                                          |
| -------- | ------------------------------------------------------------------ |
| Monorepo | pnpm workspaces, Turborepo                                         |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, next-intl, Leaflet |
| Backend  | NestJS 11, Fastify, Prisma                                         |
| Database | PostgreSQL, PostGIS                                                |
| Search   | Meilisearch, fallback PostgreSQL                                   |
| Storage  | AWS S3 presigned URLs, Cloudinary legacy support                   |
| AI       | Qdrant Cloud Inference, Gemini                                     |
| QA       | ESLint, TypeScript, Jest, Playwright                               |

## Cấu Trúc Repo

```txt
.
├─ apps/
│  ├─ api/      # NestJS API, Prisma, AI, S3, admin, public endpoints
│  └─ web/      # Next.js app, public UI, admin UI, route handlers
├─ packages/
│  └─ types/    # Shared TypeScript contracts
├─ docs/        # Production, security, monitoring and product docs
└─ docker-compose.yml
```

## Chạy Local

### Yêu Cầu

- Node.js 20+
- pnpm 9
- Docker, nếu chạy API/database local

### Cài Dependencies

```bash
pnpm install
```

### Cách 1: Web Local Dùng API Production

Dành cho người chỉ muốn sửa giao diện nhanh, không cần chạy database/API local.

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
API_INTERNAL_URL=https://vivu-api.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

```bash
pnpm --filter @vivu/web dev
```

Mở <http://localhost:3000>. Nếu đổi `.env.local`, restart dev server.

### Cách 2: Full Local Web + API + Database

Windows PowerShell:

```powershell
docker compose up -d db meilisearch
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm --filter @vivu/api db:setup
pnpm dev
```

macOS/Linux:

```bash
docker compose up -d db meilisearch
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @vivu/api db:setup
pnpm dev
```

`db:setup` chạy Prisma generate, Prisma db push và PostGIS setup theo script hiện tại. Nếu web gọi `http://localhost:4000`, API local phải đang chạy và có đủ env cần thiết.

## Biến Môi Trường

Không commit `.env`, `.env.local` hoặc secret thật. Các biến `NEXT_PUBLIC_*` xuất hiện trong client bundle, nên không chứa secret.

### Backend `apps/api/.env`

Nhóm biến chính:

- Runtime/database: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`
- Auth/security: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ABUSE_HASH_SECRET`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_ENABLED`
- AI: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `GEMINI_MAX_OUTPUT_TOKENS`
- Qdrant: `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_TEXT_COLLECTION`, `QDRANT_IMAGE_COLLECTION`, `QDRANT_TEXT_MODEL`, `QDRANT_IMAGE_MODEL`, `QDRANT_IMAGE_TEXT_MODEL`, `QDRANT_TIMEOUT_MS`
- Retrieval limits: `TOP_K_TEXT`, `TOP_K_IMAGES`, `IMAGE_MATCH_THRESHOLD`, `AI_MAX_IMAGE_SIZE_BYTES`
- Storage: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `S3_PRESIGNED_EXPIRES_IN`, `S3_SERVER_SIDE_ENCRYPTION`
- Search/cache: `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`, `REFERENCE_DATA_CACHE_TTL_MS`, `S3_PRESIGNED_CACHE_MAX_ENTRIES`

### Frontend `apps/web/.env.local`

Web local gọi production API:

```env
NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
API_INTERNAL_URL=https://vivu-api.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_IMAGE_REMOTE_HOSTS=res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com
```

Web local gọi local API:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_IMAGE_REMOTE_HOSTS=
```

Biến frontend tùy chọn:

- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_FACEBOOK_URL`
- `NEXT_PUBLIC_INSTAGRAM_URL`
- `NEXT_PUBLIC_YOUTUBE_URL`
- `CSP_CONNECT_SRC_EXTRA`
- `CSP_IMG_SRC_EXTRA`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`

Không đưa AWS/Qdrant/Gemini API key vào frontend.

## Đồng Bộ Dữ Liệu

Đồng bộ địa danh/ảnh từ S3 vào PostgreSQL:

```bash
pnpm --filter @vivu/api sync:locations
```

Đồng bộ tọa độ địa danh:

```bash
pnpm --filter @vivu/api sync:coordinates
```

Reindex Meilisearch:

```bash
pnpm --filter @vivu/api reindex:meili
```

## API Chính

Tất cả API backend production dùng prefix `/api/v1`.

### Health/Meta

- `GET /api/v1/healthz`
- `GET /api/v1/readyz`
- `GET /api/v1/build-info`

### Public Data

- `GET /api/v1/places`
- `GET /api/v1/places/nearby`
- `GET /api/v1/places/:slug`
- `GET /api/v1/places/:slug/images`
- `GET /api/v1/categories`
- `GET /api/v1/regions`
- `GET /api/v1/search/suggest`

### AI & Trip Planner

- `POST /api/v1/ai/chat`
- `GET /api/v1/ai/health`
- `POST /api/v1/trip-plans/generate`
- `GET /api/v1/trip-plans`
- `GET /api/v1/trip-plans/:id`
- `GET /api/v1/trip-plans/shared/:shareId`
- `POST /api/v1/trip-plans/:id/share`
- `POST /api/v1/trip-plans/:id/unshare`
- `POST /api/v1/trip-plans/:id/save-to-collection`

### Leads & Reports

- `POST /api/v1/leads`
- `POST /api/v1/data-reports`

### Admin

Admin endpoints yêu cầu xác thực và role phù hợp.

- `GET /api/v1/admin/leads`
- `PATCH /api/v1/admin/leads/:id/status`
- `PATCH /api/v1/admin/leads/:id/note`
- `GET /api/v1/admin/data-reports`
- `PATCH /api/v1/admin/data-reports/:id/status`
- `GET /api/v1/admin/places`
- `POST /api/v1/admin/places`
- `PATCH /api/v1/admin/places/:id`
- `POST /api/v1/admin/places/:id/photos`
- `GET /api/v1/admin/reviews`
- `POST /api/v1/admin/reviews/:id/hide`
- `GET /api/v1/admin/stats`
- `GET /api/v1/admin/audit-logs`

## Troubleshooting

### Local Web Báo Lỗi 500 Ở Trang Địa Danh

Nguyên nhân thường gặp là `NEXT_PUBLIC_API_URL` đang trỏ `http://localhost:4000` nhưng API local chưa chạy hoặc thiếu env. Có thể đổi web local sang API production hoặc chạy API local trước.

### Lỗi `column geo does not exist`

Chạy lại setup database/PostGIS:

```bash
pnpm --filter @vivu/api db:setup
```

### Prisma Client Chưa Generate

Chạy:

```bash
pnpm --filter @vivu/api prisma:generate
```

Root `pnpm typecheck` cũng tự chạy bước này trước Turbo typecheck.

### Không Thấy Ảnh Địa Danh

Kiểm tra AWS env, bucket/key ảnh, presigned URL, `S3_PRESIGNED_EXPIRES_IN` và `NEXT_IMAGE_REMOTE_HOSTS`. Nếu chạy local bằng production API, đảm bảo hostname ảnh production nằm trong allowlist của Next Image.

### Không Gửi Được Form Turnstile

Kiểm tra:

- `TURNSTILE_ENABLED`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- domain/site key trên Cloudflare Turnstile

### Search Không Ra Kết Quả

Kiểm tra Meilisearch đang chạy và reindex lại:

```bash
pnpm --filter @vivu/api reindex:meili
```

Nếu Meilisearch chưa sẵn sàng, API sẽ fallback PostgreSQL cho các luồng đã hỗ trợ fallback.

### Docker Hoặc Port Bị Chiếm

- Kiểm tra Docker Desktop đang chạy.
- Kiểm tra port `3000`, `4000`, database và Meilisearch chưa bị process khác chiếm.
- Nếu đổi port API, cập nhật lại `NEXT_PUBLIC_API_URL` và `API_INTERNAL_URL` rồi restart web dev server.

## Kiểm Tra Chất Lượng

```bash
pnpm --filter @vivu/api prisma:generate
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vivu/api test
pnpm --filter @vivu/api test:int
pnpm e2e:web
```

Ghi chú:

- Integration test cần Docker.
- Playwright smoke tests dùng `E2E_BASE_URL` khi kiểm thử against deployed app.
- E2E không nên gọi Gemini thật nếu đang chạy CI hoặc smoke test không cần AI live.

## Tài liệu

- [Mục lục tài liệu](docs/README.md)
- [Tổng quan dự án](docs/overview.md)
- [Kiến trúc hệ thống](docs/architecture.md)
- [Chạy local](docs/local-development.md)
- [Biến môi trường](docs/environment.md)
- [Data pipeline](docs/data-pipeline.md)
- [Vận hành production](docs/operations.md)
- [Security](docs/security.md)
- [Testing](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)

## Quy Ước An Toàn

- Không commit `.env`, API key, JWT secret, AWS key, Qdrant key hoặc Gemini key.
- Không chạy embedding local trong backend.
- Không tạo lại collection Qdrant nếu không có kế hoạch migration rõ ràng.
- Không gọi AWS/Qdrant/Gemini trực tiếp từ frontend.
- Không hard-code danh sách địa danh trong frontend; database/backend là nguồn dữ liệu chính.
- Không sửa logo Vivu hoặc đổi brand name Vivu khi không có yêu cầu thiết kế rõ ràng.

## Maintainer

- Nguyễn Đình Viễn
- GitHub: [@dinhvien04](https://github.com/dinhvien04)
- Email hỗ trợ: cấu hình qua `NEXT_PUBLIC_SUPPORT_EMAIL`

## License

TBD. Mã nguồn, dữ liệu và hình ảnh trong repo/dataset không được tái sử dụng khi chưa có sự cho phép của tác giả hoặc dự án Vivu.

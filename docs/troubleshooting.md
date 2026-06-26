# Troubleshooting

Các lỗi thường gặp khi chạy Vivu local hoặc kiểm tra production.

## Local Web Báo Lỗi 500 Ở Trang Địa Danh

Nguyên nhân thường gặp:

- `NEXT_PUBLIC_API_URL` đang trỏ `http://localhost:4000` nhưng API local chưa chạy.
- API local thiếu env bắt buộc.
- Database local chưa setup hoặc thiếu PostGIS column.

Cách xử lý nhanh:

- Nếu chỉ sửa UI, đổi web local sang API production trong `apps/web/.env.local`.
- Nếu chạy full local, chạy API trước và kiểm tra `http://localhost:4000/api/v1/healthz`.

## API Local Không Chạy

- Kiểm tra `apps/api/.env` đã tồn tại.
- Kiểm tra `DATABASE_URL`, JWT secrets và `CORS_ORIGINS`.
- Kiểm tra port `4000` chưa bị process khác chiếm.

## Lỗi `column geo does not exist`

Chạy lại setup database/PostGIS:

```bash
pnpm --filter @vivu/api db:setup
```

## Prisma Client Chưa Generate

```bash
pnpm --filter @vivu/api prisma:generate
```

Root `pnpm typecheck` đã tự chạy Prisma generate trước Turbo typecheck.

## Không Thấy Ảnh Địa Danh

Kiểm tra:

- AWS env backend.
- S3 bucket/key ảnh.
- Presigned URL từ backend.
- `S3_PRESIGNED_EXPIRES_IN`.
- `NEXT_IMAGE_REMOTE_HOSTS` trong web env.

Frontend không gọi S3 trực tiếp.

## Turnstile Lỗi

Kiểm tra:

- `TURNSTILE_ENABLED`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Domain/site key trong Cloudflare Turnstile

Khi chạy local, có thể tắt Turnstile theo env backend nếu flow đang cần test nhanh.

## Search Không Có Kết Quả

Kiểm tra Meilisearch đang chạy, sau đó reindex:

```bash
pnpm --filter @vivu/api reindex:meili
```

API có fallback PostgreSQL ở các luồng đã được hỗ trợ, nhưng kết quả có thể khác search engine.

## Trip Planner Hoặc AI Chat Lỗi

Kiểm tra:

- `AI_FEATURE_ENABLED`
- `TRIP_PLANNER_FEATURE_ENABLED`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- Gemini quota/rate limit.
- `QDRANT_URL`
- `QDRANT_API_KEY`
- Qdrant collection/model env.

Không đưa Gemini/Qdrant key vào frontend.

## E2E Fail Vì Base URL

Nếu test against production hoặc preview, set:

```bash
E2E_BASE_URL=https://vivu-web.vercel.app pnpm e2e:web
```

Nếu không set `E2E_BASE_URL`, Playwright có thể dùng web server local theo config hiện tại.

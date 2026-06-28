# Security Hardening

Xem thêm checklist chống DevTools/Console abuse và Self-XSS tại
[`SECURITY_CONSOLE_ABUSE.md`](SECURITY_CONSOLE_ABUSE.md).

Tài liệu này ghi các quy tắc vận hành an toàn cho Vivu. Mục tiêu là giảm rủi ro lộ khóa,
lạm dụng AI, upload file độc hại, IDOR/BOLA và lỗi cấu hình production.

## Nguyên tắc bắt buộc

- Không commit `.env`, token, presigned URL, log chứa secret hoặc dữ liệu nhạy cảm.
- Frontend không gọi trực tiếp AWS S3, Qdrant, Gemini hoặc Meilisearch private key.
- API key chỉ nằm ở backend env hoặc secret manager của nền tảng deploy.
- Qdrant Cloud chỉ dùng cho AI retrieval, không dùng làm database hiển thị chính.
- Không chạy embedding local và không import Transformers/Torch/BGE/SigLIP trong backend.
- Swagger/debug/deep health chỉ bật có chủ đích, không bật mặc định ở production.

## Backend

### Auth

- Access token dùng TTL ngắn (`15m`).
- Refresh token lưu dạng hash trong database và được rotate khi refresh.
- Web giữ refresh token trong cookie `HttpOnly`, `SameSite=Lax`, `Secure` ở production và giới hạn
  path dưới `/api/auth`.
- Login có soft lockout theo email đã hash:
  - `AUTH_LOGIN_MAX_FAILURES`
  - `AUTH_LOGIN_LOCKOUT_WINDOW_MS`
- Reset password token không được log trong production.
- Thông báo login/reset không được tiết lộ email có tồn tại hay không.

### AI Chat

`POST /api/v1/ai/chat` có các lớp bảo vệ:

- Global throttling qua Nest Throttler.
- Quota/ngày theo user hoặc IP/session đã hash:
  - `AI_DAILY_QUOTA_ANON`
  - `AI_DAILY_QUOTA_USER`
  - `AI_RATE_LIMIT_PER_MINUTE`
  - `AI_QUOTA_HASH_SECRET`
- Upload ảnh chỉ nhận JPEG/PNG/WebP và kiểm tra magic bytes, không chỉ tin vào MIME từ client.
- Giới hạn kích thước ảnh bằng `AI_MAX_IMAGE_SIZE_BYTES`.
- Log AI chỉ ghi metadata như input type, latency, kích thước ảnh, trạng thái; không log prompt đầy đủ,
  ảnh, API key hoặc presigned URL.
- Qdrant/Gemini có timeout:
  - `QDRANT_TIMEOUT_MS`
  - `GEMINI_TIMEOUT_MS`
  - `GEMINI_MAX_OUTPUT_TOKENS`

### Health/debug

- `GET /api/v1/ai/health` ở production mặc định chỉ trả trạng thái gọn.
- `GET /api/v1/ai/health/qdrant` và `/gemini` bị ẩn ở production nếu
  `AI_DEEP_HEALTH_ENABLED` không phải `true`.
- Các endpoint debug AI trả `404` trong production.

### Validation và pagination

- Global `ValidationPipe` đang bật `whitelist`, `forbidNonWhitelisted`, `transform`.
- Các API list/search phải có `pageSize`/`limit` tối đa.
- Query search công khai nên giữ tối đa khoảng 120 ký tự để tránh abuse.

## S3

Bucket ảnh nên cấu hình:

- Block Public Access: bật toàn bộ.
- IAM least privilege: backend chỉ cần `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` trên bucket/prefix cần dùng.
- Không cấp quyền `s3:DeleteObject` cho app runtime nếu chưa thật sự cần.
- Bật server-side encryption mặc định hoặc cho phép `AES256`.
- Runtime mặc định gửi `S3_SERVER_SIDE_ENCRYPTION=AES256`; nếu bucket policy dùng cấu hình
  khác, chỉnh env thay vì sửa code.
- Lifecycle rule xóa prefix upload tạm sau 1 ngày:

```text
Prefix: vivu/ai/temp/
Expiration: 1 day
Abort incomplete multipart upload: 1 day
```

- Bật AWS billing alert và theo dõi số lượng object/presigned request bất thường.
- Presigned URL chỉ tạo ở backend, TTL ngắn qua `S3_PRESIGNED_EXPIRES_IN`.

## Frontend

Next.js đặt các header bảo mật:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- HSTS trong production

Nếu production cần gọi thêm domain API/CDN, cấu hình bằng:

```env
CSP_CONNECT_SRC_EXTRA=
CSP_IMG_SRC_EXTRA=
```

Không đặt key nhạy cảm trong biến `NEXT_PUBLIC_*`.

## Logging và monitoring

- Request log chỉ ghi method, path không query, status code, latency và request id.
- Không log Authorization header, cookie, request body, file upload, presigned URL hoặc secret.
- Sentry có thể được bật sau bằng `SENTRY_DSN` và `SENTRY_ENVIRONMENT`; app không được fail nếu
  các env này trống.
- Nên cấu hình alert cho:
  - tỷ lệ 401/403/429 tăng bất thường
  - AI quota bị chạm liên tục
  - lỗi 5xx từ Qdrant/Gemini/S3
  - tăng đột biến chi phí AWS/Gemini/Qdrant

## Checklist trước production

1. `NODE_ENV=production`.
2. `SWAGGER_ENABLED=false`, trừ khi có bảo vệ riêng.
3. `AI_DEEP_HEALTH_ENABLED=false`, trừ khi endpoint được bảo vệ nội bộ.
4. `CORS_ORIGINS` chỉ chứa domain web production.
5. Tất cả secret được tạo bằng random mạnh, không dùng giá trị example.
6. Chạy migration Prisma và `prisma generate`.
7. Chạy `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @vivu/api test`.
8. Kiểm tra S3 Block Public Access và lifecycle cho `vivu/ai/temp/`.
9. Kiểm tra Vercel env: `NEXT_PUBLIC_API_URL` trỏ đúng API production.

## Báo cáo lỗ hổng

Nếu phát hiện lỗ hổng, không đăng public exploit hoặc secret. Ghi lại endpoint, tác động,
cách tái hiện tối thiểu và gửi cho maintainer dự án để xử lý.

# Environment Variables

Tài liệu này mô tả nhóm biến môi trường của Vivu. Không ghi secret thật vào docs hoặc commit `.env`.

## Nguyên Tắc

- Không commit `.env`, `.env.local`, API key, JWT secret, AWS key, Qdrant key hoặc Gemini key.
- Không đưa secret vào frontend.
- Mọi biến `NEXT_PUBLIC_*` sẽ xuất hiện trong client bundle, nên chỉ dùng cho giá trị public.
- API key cho AWS, Qdrant và Gemini chỉ nằm ở backend env.

## Backend `apps/api/.env`

### Runtime & Database

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`, nếu dùng URL riêng cho migration
- `CORS_ORIGINS`

Production API nên dùng Neon pooled `DATABASE_URL` cho runtime. Migration nên dùng URL trực tiếp khi hạ tầng yêu cầu.

### Auth & Security

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ABUSE_HASH_SECRET`
- `AUTH_LOGIN_MAX_FAILURES`
- `AUTH_LOGIN_LOCKOUT_WINDOW_MS`
- `TURNSTILE_ENABLED`
- `TURNSTILE_SECRET_KEY`

### AWS S3

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `S3_PRESIGNED_EXPIRES_IN`
- `S3_PRESIGNED_CACHE_MAX_ENTRIES`
- `S3_SERVER_SIDE_ENCRYPTION`

### Qdrant

- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_TEXT_COLLECTION`
- `QDRANT_IMAGE_COLLECTION`
- `QDRANT_TEXT_MODEL`
- `QDRANT_IMAGE_MODEL`
- `QDRANT_IMAGE_TEXT_MODEL`
- `QDRANT_TIMEOUT_MS`

### Gemini

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_TIMEOUT_MS`
- `GEMINI_MAX_OUTPUT_TOKENS`

### Search, Quota & Feature Flags

- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `REFERENCE_DATA_CACHE_TTL_MS`
- `GLOBAL_RATE_LIMIT_PER_MINUTE`
- `AI_FEATURE_ENABLED`
- `AI_CHAT_RATE_LIMIT_PER_MINUTE`
- `AI_DAILY_QUOTA_ANON`
- `AI_DAILY_QUOTA_USER`
- `TRIP_PLANNER_FEATURE_ENABLED`
- `TRIP_PLANNER_RATE_LIMIT_PER_MINUTE`
- `TRIP_PLANNER_DAILY_QUOTA_ANON`
- `TRIP_PLANNER_DAILY_QUOTA_USER`

## Frontend `apps/web/.env.local`

### API & Site

- `NEXT_PUBLIC_API_URL`
- `API_INTERNAL_URL`
- `NEXT_PUBLIC_SITE_URL`

### Images, Turnstile, CSP & Monitoring

- `NEXT_IMAGE_REMOTE_HOSTS`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `CSP_CONNECT_SRC_EXTRA`
- `CSP_IMG_SRC_EXTRA`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`

### Support & Social

- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_FACEBOOK_URL`
- `NEXT_PUBLIC_INSTAGRAM_URL`
- `NEXT_PUBLIC_YOUTUBE_URL`

## Examples

Web local dùng production API:

```env
NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
API_INTERNAL_URL=https://vivu-api.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_IMAGE_REMOTE_HOSTS=res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com
```

Web local dùng local API:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_IMAGE_REMOTE_HOSTS=
```

Danh sách mẫu đầy đủ nằm trong `apps/api/.env.example` và `apps/web/.env.example`.

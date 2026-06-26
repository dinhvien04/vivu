# Local Development

Hướng dẫn chạy Vivu ở máy local. Có hai mode chính: chỉ chạy web local với API production, hoặc chạy full local gồm web, API, database và search.

## Yêu Cầu

- Node.js 20+
- pnpm 9
- Docker, nếu chạy API/database local hoặc integration test

## Cài Dependencies

```bash
pnpm install
```

## Cách 1: Web Local Dùng API Production

Phù hợp khi chỉ sửa giao diện và muốn dùng dữ liệu production.

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

Mở web tại <http://localhost:3000>.

## Cách 2: Full Local Web + API + Database

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

## Local URLs

- Web: <http://localhost:3000>
- API: <http://localhost:4000/api/v1>
- Swagger: <http://localhost:4000/docs>
- Web build info: <http://localhost:3000/build-info>
- API build info: <http://localhost:4000/api/v1/build-info>

## Ghi Chú

- Sửa `.env.local` xong phải restart Next.js dev server.
- Nếu web trỏ `http://localhost:4000`, API local phải đang chạy và có đủ env.
- `pnpm --filter @vivu/api db:setup` chạy Prisma generate, Prisma db push và PostGIS setup.
- Integration test cần Docker.
- Nếu local web báo 500 ở trang địa danh, xem [Troubleshooting](troubleshooting.md).

# Vivu

> Portal **tra cứu địa điểm du lịch Việt Nam**. Người dùng tìm – xem – lưu – đánh giá – chia sẻ. **Không có yếu tố thương mại** (đặt phòng, tour, thanh toán).

- **Frontend:** [Next.js 14](https://nextjs.org) (App Router, TS, Tailwind) — `apps/web`
- **Backend:** [NestJS 10](https://nestjs.com) (Fastify, Prisma) — `apps/api`
- **Database:** PostgreSQL (+ PostGIS sẽ thêm sau)
- **Search:** MeiliSearch (sẽ tích hợp ở v1)
- **Mono-repo:** pnpm workspaces + Turborepo

## Cấu trúc

```
vivu/
├─ apps/
│  ├─ web/        # Next.js 14 app
│  └─ api/        # NestJS 10 app
├─ packages/
│  └─ types/      # Shared TypeScript types
├─ docs/
│  └─ overview.md # Tài liệu tổng quan đầy đủ
├─ docker-compose.yml
├─ pnpm-workspace.yaml
├─ turbo.json
└─ package.json
```

## Yêu cầu

- Node.js >= 20 (xem `.nvmrc`)
- pnpm >= 9
- Docker (để chạy Postgres local)

## Bắt đầu nhanh

```bash
# 1. Cài deps
pnpm install

# 2. Khởi động Postgres local
docker compose up -d db

# 3. Tạo file env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Sinh Prisma client + migrate (lần đầu)
pnpm --filter @vivu/api prisma:generate
pnpm --filter @vivu/api prisma:migrate

# 5. Chạy cả FE + BE song song
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- API Docs (Swagger): http://localhost:4000/docs

## Scripts gốc

| Lệnh             | Mô tả                                   |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Chạy dev cả `web` + `api` qua Turborepo |
| `pnpm build`     | Build tất cả workspaces                 |
| `pnpm lint`      | Lint tất cả workspaces                  |
| `pnpm typecheck` | Type-check tất cả workspaces            |
| `pnpm format`    | Prettier format toàn repo               |

## Quy ước

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`...
- Branch: `feat/<scope>`, `fix/<scope>`. Không push thẳng vào `main`.
- TS strict bật toàn repo. Không dùng `any` trừ khi có lý do.
- Mỗi PR cần: lint pass, typecheck pass, build pass, có test nếu thay đổi logic.

## Tài liệu

- [Tài liệu tổng quan dự án](./docs/overview.md) — kiến trúc, schema, API, lộ trình, security, SEO, ...

## License

Private — chưa quyết định license công khai.

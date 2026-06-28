# Quality And Test Commands

Các lệnh kiểm tra chất lượng thường dùng trong Vivu.

## Local Checks

```bash
pnpm --filter @vivu/api prisma:generate
pnpm lint
pnpm typecheck
pnpm build
```

Root `pnpm typecheck` tự chạy Prisma generate trước Turbo typecheck.

## API Tests

```bash
pnpm --filter @vivu/api test
pnpm --filter @vivu/api test:int
```

Integration test cần Docker vì có thể dùng Testcontainers/database local.

## Web E2E

```bash
pnpm e2e:web
```

Khi test against production hoặc preview:

```bash
E2E_BASE_URL=https://vivu-web.vercel.app pnpm e2e:web
```

Không nên gọi Gemini thật trong E2E/CI nếu test không cần xác thực AI live.

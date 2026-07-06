# Hướng dẫn commit & Pull Request (Vivu)

Tài liệu này bổ sung cho [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md). Mọi thay đổi đáng kể **không push thẳng `main`** trừ khi maintainer yêu cầu rõ.

## Quy trình chuẩn

1. Tạo branch từ `main`: `feat/...`, `fix/...`, `chore/...`, `docs/...`
2. Commit từng nhóm thay đổi logic, message ngắn tiếng Việt hoặc tiếng Anh rõ nghĩa
3. Push branch → mở **Pull Request** trên GitHub
4. Điền PR body **đúng cấu trúc** `PULL_REQUEST_TEMPLATE.md` (tiếng Việt)
5. Chạy checklist trước khi merge

## Cấu trúc PR body (bắt buộc)

```markdown
## Mô tả

<!-- Tóm tắt thay đổi và lý do. Bullet nếu nhiều mục. -->

## Loại thay đổi

- [ ] feat - tính năng mới
- [ ] fix - sửa lỗi
- [ ] refactor - thay đổi cấu trúc, không đổi hành vi
- [ ] docs - tài liệu
- [ ] chore - cấu hình hoặc công cụ

## Checklist

- [ ] Đã chạy `pnpm format:check`, `pnpm lint`, `pnpm typecheck` và `pnpm build`
- [ ] Có test cho phần logic mới nếu cần
- [ ] Đã cập nhật tài liệu khi thay đổi API hoặc cấu hình
- [ ] Không commit secret hoặc file `.env`
```

Tick `[x]` những mục đã làm. Ghi rõ migration, env mới, hoặc bước deploy nếu có.

## Commit message

- **Một dòng tóm tắt** (≤ 72 ký tự), ví dụ: `fix(api): chặn OAuth token trong URL query`
- Không gộp nhiều feature không liên quan vào một commit
- Không commit: `.env`, `terminals/`, `mcps/`, secret, API key

## Checklist kỹ thuật (trước merge)

```bash
pnpm --filter @vivu/api prisma:generate
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @vivu/api test
```

Có migration Prisma → ghi trong PR và chạy `prisma migrate deploy` trên production sau merge.

## Agent / AI assistant

Khi được yêu cầu "đẩy git" hoặc "push":

1. Đọc `PULL_REQUEST_TEMPLATE.md` và file này
2. Tạo branch, không push thẳng `main` (trừ khi user nói rõ)
3. Soạn sẵn **toàn bộ PR body** tiếng Việt theo template cho user copy hoặc mở PR
4. Không bao giờ đưa secret vào code, commit message, hay chat log vào repo
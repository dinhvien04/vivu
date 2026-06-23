# Vivu Deploy Checklist

Cập nhật: 23/06/2026.

## Trước khi deploy

- [ ] Đối chiếu branch deploy là `main`.
- [ ] Ghi lại main commit hash bằng `git rev-parse HEAD`.
- [ ] `pnpm --filter @vivu/api prisma:generate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Kiểm tra production env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_IMAGE_REMOTE_HOSTS`.
- [ ] Kiểm tra backend env cho database, AWS S3, Qdrant, Gemini, quota AI và lead rate limit.
- [ ] Vercel web/API deploy xong và trạng thái là `Ready`.

## Smoke test public web

- [ ] `/` hiển thị tiếng Việt mặc định, hero có ảnh địa danh ưu tiên, CTA lịch trình AI và tư vấn chuyến đi.
- [ ] `/en` hiển thị bản tiếng Anh tương ứng.
- [ ] Header desktop/mobile có: Trang chủ, Khám phá, Bản đồ, Lịch trình AI, Tư vấn, AI Chat.
- [ ] `/kham-pha` tải địa danh từ backend.
- [ ] `/ban-do` hiển thị bản đồ hoặc thông báo dữ liệu bản đồ đang cập nhật.
- [ ] `/lich-trinh` render form, có 3 mẫu gợi ý, nút `Tạo lịch trình AI` và tạo lịch trình thành công.
- [ ] `/tu-van` render form, giữ prefill từ URL và gửi lead test.
- [ ] `/ai-chat` render chatbot và gửi được câu hỏi test.
- [ ] Trang `/dia-diem/:slug` có CTA thêm vào lịch trình, tư vấn chuyến đi và báo lỗi thông tin.

## Smoke test admin/SEO

- [ ] `/admin/leads` xem được lead test.
- [ ] `/admin/bao-loi` xem được data report test.
- [ ] `/sitemap.xml` có `/`, `/en`, `/lich-trinh`, `/tu-van`, `/ai-chat` và trang địa danh.
- [ ] `/robots.txt` có `Sitemap` và disallow `/admin`, `/api`, route tài khoản/private.

## Nguyên tắc an toàn

- [ ] Không đổi logo Vivu.
- [ ] Không đổi brand name Vivu.
- [ ] Không đưa secret/API key ra frontend.
- [ ] Frontend không gọi trực tiếp S3, Qdrant hoặc Gemini.
- [ ] Qdrant chỉ dùng cho AI retrieval, database vẫn là nguồn hiển thị chính.

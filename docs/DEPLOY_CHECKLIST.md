# Vivu Deploy Checklist

Cập nhật: 23/06/2026.

## Trước khi deploy

- [ ] `pnpm --filter @vivu/api prisma:generate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Kiểm tra production env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_IMAGE_REMOTE_HOSTS`.
- [ ] Kiểm tra backend env cho database, AWS S3, Qdrant, Gemini, quota AI và lead rate limit.

## Smoke test public web

- [ ] `/` hiển thị tiếng Việt mặc định, hero nói về lập lịch trình AI và tư vấn chuyến đi.
- [ ] Header desktop/mobile có: Trang chủ, Khám phá, Bản đồ, Lịch trình AI, Tư vấn, AI Chat.
- [ ] `/kham-pha` tải địa danh từ backend.
- [ ] `/ban-do` hiển thị bản đồ hoặc thông báo dữ liệu bản đồ đang cập nhật.
- [ ] `/lich-trinh` render form và tạo lịch trình.
- [ ] `/tu-van` render form và gửi lead test.
- [ ] `/ai-chat` render chatbot và gửi được câu hỏi test.
- [ ] Trang `/dia-diem/:slug` có CTA thêm vào lịch trình, tư vấn chuyến đi và báo lỗi thông tin.

## Smoke test admin/SEO

- [ ] `/admin/leads` xem được lead test.
- [ ] `/admin/bao-loi` xem được data report test.
- [ ] `/sitemap.xml` có `/lich-trinh`, `/tu-van` và trang địa danh.
- [ ] `/robots.txt` có `Sitemap` và disallow `/admin`, `/api`, route tài khoản/private.

## Nguyên tắc an toàn

- [ ] Không đổi logo Vivu.
- [ ] Không đổi brand name Vivu.
- [ ] Không đưa secret/API key ra frontend.
- [ ] Frontend không gọi trực tiếp S3, Qdrant hoặc Gemini.
- [ ] Qdrant chỉ dùng cho AI retrieval, database vẫn là nguồn hiển thị chính.

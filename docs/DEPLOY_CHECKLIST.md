# Vivu Deploy Checklist

Cập nhật: 24/06/2026.

## Trước khi deploy

- [ ] Đối chiếu branch deploy là `main`.
- [ ] Ghi lại main commit hash bằng `git rev-parse HEAD`.
- [ ] `pnpm --filter @vivu/api prisma:generate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Kiểm tra production env `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_IMAGE_REMOTE_HOSTS`.
- [ ] `NEXT_IMAGE_REMOTE_HOSTS` có đủ:
  `res.cloudinary.com`,
  `gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com`,
  `s3.ap-southeast-1.amazonaws.com`.
- [ ] Không bật wildcard image remote host trong production.
- [ ] Kiểm tra backend env cho database, AWS S3, Qdrant, Gemini, quota AI và lead rate limit.
- [ ] Vercel web/API deploy xong và trạng thái là `Ready`.

## Smoke test public web

- [ ] `/` hiển thị tiếng Việt mặc định, hero có ảnh địa danh ưu tiên, CTA lịch trình AI và tư vấn chuyến đi.
- [ ] `/en` hiển thị bản tiếng Anh tương ứng.
- [ ] Header desktop/mobile có: Trang chủ, Khám phá, Bản đồ, Lịch trình AI, Tư vấn, AI Chat.
- [ ] `/kham-pha` tải địa danh từ backend, không dùng data demo toàn quốc.
- [ ] `/ban-do` hiển thị bản đồ Gia Lai/Bình Định cũ hoặc thông báo dữ liệu bản đồ đang cập nhật.
- [ ] `/lich-trinh` render form, có mẫu gợi ý, không tự generate trước khi người dùng bấm.
- [ ] `/tu-van` render form, giữ prefill từ URL và gửi lead test.
- [ ] `/ai-chat` render chatbot và gửi được câu hỏi test.
- [ ] Trang `/dia-diem/:slug` có CTA thêm vào lịch trình, tư vấn chuyến đi và báo lỗi thông tin.

## Smoke test ảnh production

Kiểm tra các route sau không bị ảnh vỡ sau khi set `NEXT_IMAGE_REMOTE_HOSTS`:

- [ ] `/`
- [ ] `/kham-pha`
- [ ] `/dia-diem/eo-gio`
- [ ] `/dia-diem/bien-ho`
- [ ] `/dia-diem/thap-banh-it`
- [ ] `/dia-diem/cu-lao-xanh`
- [ ] `/dia-diem/bai-xep`
- [ ] `/dia-diem/bao-tang-quang-trung`

## Flow lịch trình → lead → admin

- [ ] Mở `/lich-trinh`.
- [ ] Chọn khu vực/số ngày/sở thích và bấm tạo lịch trình.
- [ ] Kết quả hiển thị theo từng ngày, có tên địa danh, mô tả, lưu ý và nguồn dữ liệu nếu có.
- [ ] Bấm `Gửi yêu cầu tư vấn`.
- [ ] URL chuyển sang `/tu-van?source=trip_planner...`.
- [ ] Form tư vấn được prefill note lịch trình và địa danh nếu có.
- [ ] Gửi lead test thành công.
- [ ] Admin mở `/admin/leads` thấy lead mới.
- [ ] Admin copy phone/Zalo được.
- [ ] Admin đổi status lead được.
- [ ] Khi không có lead, admin thấy empty state `Chưa có lead mới.`

## Flow báo lỗi dữ liệu → admin

- [ ] Mở một trang địa danh.
- [ ] Bấm báo lỗi thông tin.
- [ ] Gửi report test thành công.
- [ ] Admin mở `/admin/bao-loi` thấy report mới.
- [ ] Admin lọc report theo trạng thái được.
- [ ] Admin đổi status report được.
- [ ] Khi không có report, admin thấy empty state `Chưa có báo lỗi dữ liệu.`
- [ ] Route admin có role guard, user thường không vào được.

## SEO

- [ ] `/sitemap.xml` có `/`, `/en`, `/kham-pha`, `/lich-trinh`, `/tu-van`, `/ai-chat`
  và trang địa danh đã publish.
- [ ] `/sitemap.xml` không có `/admin`, `/api`, `/tai-khoan`, `/so-tay`, `/dang-nhap`,
  `/dang-ky`.
- [ ] `/robots.txt` có `Sitemap` absolute URL.
- [ ] `/robots.txt` disallow `/admin`, `/admin/`, `/api`, `/api/`, `/tai-khoan`,
  `/tai-khoan/`, `/so-tay`, `/so-tay/`.
- [ ] Trang chi tiết địa danh có metadata title/description, canonical và JSON-LD.
- [ ] Hoàn tất các bước trong [`SEO_CHECKLIST.md`](SEO_CHECKLIST.md).

## Dữ liệu top địa danh

- [ ] Đối chiếu 20 địa danh ưu tiên trong
  [`TOP_PLACES_DATA_CHECKLIST.md`](TOP_PLACES_DATA_CHECKLIST.md).
- [ ] Mỗi địa danh ưu tiên có mô tả ngắn, ảnh hero, gallery sạch và tọa độ nếu có thể kiểm chứng.
- [ ] Không hard-code danh sách địa danh vào frontend; database/backend vẫn là nguồn chính.

## Nguyên tắc an toàn

- [ ] Không đổi logo Vivu.
- [ ] Không đổi brand name Vivu.
- [ ] Không đưa secret/API key ra frontend.
- [ ] Frontend không gọi trực tiếp S3, Qdrant hoặc Gemini.
- [ ] Qdrant chỉ dùng cho AI retrieval, database vẫn là nguồn hiển thị chính.
- [ ] Không thêm payment/booking tự động nếu chưa có quy trình vận hành.

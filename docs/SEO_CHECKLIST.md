# Vivu SEO Checklist

Cập nhật: 24/06/2026.

Checklist này dùng cho production `https://vivu-web.vercel.app` và cần chạy lại khi đổi custom domain.

## Search Console

- [ ] Tạo property cho `https://vivu-web.vercel.app`.
- [ ] Verify ownership bằng Vercel/HTML tag/DNS tùy cách triển khai.
- [ ] Submit sitemap: `https://vivu-web.vercel.app/sitemap.xml`.
- [ ] Kiểm tra Pages/Indexing sau khi submit sitemap.
- [ ] Kiểm tra URL chính: `/`, `/kham-pha`, `/ban-do`, `/lich-trinh`, `/tu-van`, `/ai-chat`.
- [ ] Kiểm tra detail page ưu tiên: `/dia-diem/eo-gio`, `/dia-diem/bien-ho`, `/dia-diem/thap-banh-it`, `/dia-diem/cu-lao-xanh`.

## Sitemap

- [ ] Sitemap có public routes: `/`, `/en`, `/kham-pha`, `/ban-do`, `/lich-trinh`, `/tu-van`, `/ai-chat`, `/tim-kiem`.
- [ ] Sitemap có các trang địa danh đã publish.
- [ ] Sitemap không có `/admin`, `/api`, `/tai-khoan`, `/so-tay`, `/dang-nhap`, `/dang-ky`.
- [ ] Sitemap dùng absolute URL đúng production origin.

## Robots

- [ ] `robots.txt` có `Sitemap: https://vivu-web.vercel.app/sitemap.xml`.
- [ ] `robots.txt` allow `/`.
- [ ] `robots.txt` disallow `/admin`, `/api`, `/tai-khoan`, `/so-tay`.
- [ ] Không dùng `robots.txt` như lớp bảo mật. Admin/API vẫn phải có auth/role guard.

## Metadata

- [ ] Homepage title/description nói đúng scope Gia Lai và Bình Định cũ.
- [ ] Trang khám phá không còn copy du lịch Việt Nam tổng quát.
- [ ] Trang chi tiết địa danh có title dạng `<Tên địa danh> · Vivu`.
- [ ] Trang chi tiết có description riêng.
- [ ] Trang chi tiết có canonical self URL.
- [ ] Hreflang/i18n đúng nếu route tiếng Anh được index.
- [ ] JSON-LD TouristAttraction/Breadcrumb nếu có đủ dữ liệu.

## Image SEO

- [ ] `NEXT_IMAGE_REMOTE_HOSTS` production có đủ host ảnh đang dùng:
  - `res.cloudinary.com`
  - `gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com`
  - `s3.ap-southeast-1.amazonaws.com`
- [ ] Không bật wildcard image remote host trong production.
- [ ] Ảnh hero các địa danh ưu tiên render được.
- [ ] Alt text dùng tên địa danh hoặc mô tả ngắn.

## Custom Domain

- [ ] Add domain vào Vercel.
- [ ] Add domain/DNS vào Cloudflare nếu dùng Cloudflare DNS.
- [ ] Cập nhật `NEXT_PUBLIC_SITE_URL`.
- [ ] Cập nhật canonical/sitemap/robots sang domain mới.
- [ ] Tạo Search Console property mới.
- [ ] Submit lại sitemap domain mới.
- [ ] Kiểm tra canonical không còn trỏ về domain Vercel cũ.

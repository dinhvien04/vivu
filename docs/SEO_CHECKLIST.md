# Vivu SEO Checklist

Cập nhật: 24/06/2026.

Checklist này dùng cho production `https://vivu-web.vercel.app` và cần chạy lại khi đổi custom
domain.

## Search Console

- [ ] Tạo property cho `https://vivu-web.vercel.app`.
- [ ] Verify ownership bằng phương án phù hợp với Vercel project.
- [ ] Submit sitemap: `https://vivu-web.vercel.app/sitemap.xml`.
- [ ] Kiểm tra mục Pages/Indexing sau khi submit sitemap.
- [ ] Kiểm tra URL chính: `/`, `/kham-pha`, `/lich-trinh`, `/tu-van`, `/ai-chat`.
- [ ] Kiểm tra một số trang địa danh ưu tiên: `/dia-diem/eo-gio`, `/dia-diem/bien-ho`,
  `/dia-diem/thap-banh-it`, `/dia-diem/cu-lao-xanh`, `/dia-diem/bai-xep`,
  `/dia-diem/bao-tang-quang-trung`.

## Sitemap

- [ ] Sitemap có public routes: `/`, `/en`, `/kham-pha`, `/ban-do`, `/lich-trinh`,
  `/tu-van`, `/ai-chat`, `/tim-kiem`.
- [ ] Sitemap có các trang địa danh đã publish.
- [ ] Sitemap không có route admin/private: `/admin`, `/api`, `/tai-khoan`, `/so-tay`,
  `/dang-nhap`, `/dang-ky`.
- [ ] Sitemap dùng absolute URL đúng production origin.

## Robots

- [ ] `robots.txt` có `Sitemap: https://vivu-web.vercel.app/sitemap.xml`.
- [ ] `robots.txt` allow `/`.
- [ ] `robots.txt` disallow `/admin`, `/admin/`, `/api`, `/api/`, `/tai-khoan`,
  `/tai-khoan/`, `/so-tay`, `/so-tay/`.
- [ ] Test robots bằng Search Console Robots Tester hoặc URL Inspection.
- [ ] Không dùng `robots.txt` như lớp bảo mật. Route admin/API vẫn phải có auth/role guard.

## Metadata

- [ ] Homepage title/description nói đúng scope Gia Lai và Bình Định cũ.
- [ ] Trang khám phá không còn copy kiểu du lịch Việt Nam tổng quát.
- [ ] Trang chi tiết địa danh có title dạng `<Tên địa danh> · Vivu`.
- [ ] Trang chi tiết có canonical self URL.
- [ ] Trang chi tiết có JSON-LD phù hợp (`TouristAttraction` và breadcrumb nếu có dữ liệu).
- [ ] Route admin/private/auth không cần index; không đưa vào sitemap.

## Image SEO

- [ ] `NEXT_IMAGE_REMOTE_HOSTS` production có đủ host ảnh đang dùng:
  `res.cloudinary.com`,
  `gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com`,
  `s3.ap-southeast-1.amazonaws.com`.
- [ ] Không bật wildcard image remote host trong production.
- [ ] Ảnh hero của các địa danh ưu tiên render được.
- [ ] Alt text dùng tên địa danh hoặc mô tả ảnh ngắn, không để rỗng khi ảnh có ý nghĩa.

## Mobile & Performance

- [ ] Kiểm tra mobile usability trong Search Console.
- [ ] Test thủ công viewport mobile cho `/`, `/kham-pha`, `/dia-diem/eo-gio`,
  `/lich-trinh`, `/tu-van`, `/ai-chat`.
- [ ] Không để gallery/lightbox khóa scroll hoặc che mất nút đóng trên mobile.
- [ ] Ưu tiên ảnh hero quan trọng dùng kích thước hợp lý; không tải ảnh không dùng.

## Khi đổi custom domain

- [ ] Cập nhật `NEXT_PUBLIC_SITE_URL`.
- [ ] Cập nhật `metadataBase` nếu có cấu hình domain mới.
- [ ] Cập nhật sitemap absolute URL.
- [ ] Cập nhật `robots.txt` sitemap URL.
- [ ] Tạo Search Console property mới cho domain mới.
- [ ] Submit lại sitemap.
- [ ] Kiểm tra canonical không còn trỏ về domain Vercel cũ.

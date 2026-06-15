# Trạng thái triển khai

Cập nhật: 15/06/2026.

## Đã hoàn thành

- [x] Monorepo Next.js + NestJS + shared types.
- [x] PostgreSQL, Prisma và PostGIS.
- [x] Đồng bộ địa danh/ảnh từ S3 vào database.
- [x] Chuẩn hóa tên tiếng Việt và mô tả ngắn.
- [x] API danh sách, chi tiết và gallery địa danh.
- [x] Giao diện Gia Lai-only lấy dữ liệu từ backend.
- [x] Bỏ dữ liệu demo du lịch toàn quốc khỏi luồng chính.
- [x] Bản đồ dùng tọa độ database.
- [x] Tìm kiếm Meilisearch với fallback PostgreSQL.
- [x] Auth, favorites, collections, reviews và Q&A.
- [x] Trang quản trị địa danh/review và audit log.
- [x] AI Chat text-only, image-only và image + text.
- [x] Qdrant Cloud Inference; không chạy embedding local.
- [x] Gemini chỉ được gọi từ backend.
- [x] Nén ảnh AI phía frontend trước khi upload.
- [x] Cache presigned URL S3 và dữ liệu regions/categories.
- [x] Production web và API trên Vercel.

## Trạng thái dữ liệu

- API công khai đang giới hạn địa danh thuộc phạm vi Gia Lai.
- Ảnh hỏng/thiếu không được render như một thẻ ảnh lỗi.
- Phần lớn địa danh đã có tọa độ.
- Hai địa danh đang cần tiếp tục xác minh tọa độ:
  - `suoi-da-vang`
  - `dinh-lang-huu-thanh`

Không nên gán tọa độ ước lượng cho hai địa danh này chỉ để đủ số lượng.

## Kiểm thử gần nhất

- API unit test: 22 test suites, 127 tests.
- API lint, typecheck và build: đạt.
- Production smoke test:
  - danh sách/chi tiết địa danh;
  - ảnh Explore;
  - Qdrant và Gemini health;
  - AI text-only, image-only, image + text.

## Việc bảo trì tiếp theo

- [ ] Xác minh hai tọa độ còn thiếu bằng nguồn đáng tin cậy.
- [ ] Theo dõi tỷ lệ lỗi S3/presigned URL trên production.
- [ ] Bổ sung dashboard quan sát latency API và AI.
- [ ] Chạy integration test định kỳ trong CI có Docker.
- [ ] Rà soát chất lượng mô tả địa danh khi dữ liệu S3 thay đổi.

## Nguyên tắc khi tiếp tục phát triển

- Database vẫn là nguồn dữ liệu hiển thị chính.
- Không đưa secret ra frontend.
- Không thay đổi logo hoặc brand Vivu.
- Không nhập lại dữ liệu demo toàn quốc.
- Mọi thay đổi schema phải kèm Prisma migration hoặc quy trình `db:setup`
  tương ứng.

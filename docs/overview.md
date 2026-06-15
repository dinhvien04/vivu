# Tổng quan hệ thống Vivu

## 1. Mục tiêu

Vivu là hệ thống tra cứu và khám phá địa danh Gia Lai. Người dùng có thể xem
địa điểm, ảnh, bản đồ, tìm kiếm, đánh giá, lưu vào sổ tay và hỏi trợ lý AI bằng
văn bản hoặc hình ảnh.

Ba nguyên tắc dữ liệu:

1. PostgreSQL là nguồn dữ liệu chính cho giao diện.
2. S3 lưu ảnh; mọi quyền truy cập ảnh được cấp qua backend.
3. Qdrant chỉ phục vụ AI retrieval, không thay thế database nghiệp vụ.

## 2. Kiến trúc

```text
Browser
   |
   v
Next.js Web
   |
   v
NestJS API
   |---- PostgreSQL/PostGIS
   |---- Meilisearch
   |---- AWS S3
   |---- Qdrant Cloud Inference
   `---- Google Gemini
```

Frontend chỉ giao tiếp với API Vivu. Các dịch vụ có khóa bí mật đều được gọi
từ backend.

## 3. Frontend

Thư mục: `apps/web`

- Next.js 14 App Router
- TypeScript và Tailwind CSS
- `next-intl` cho tiếng Việt/tiếng Anh
- Leaflet cho bản đồ
- Next route handlers dùng làm same-origin proxy cho các luồng cần cookie hoặc
  upload

Các route chính:

| Route              | Chức năng                    |
| ------------------ | ---------------------------- |
| `/`                | Trang chủ Gia Lai            |
| `/kham-pha`        | Danh sách và bộ lọc địa danh |
| `/dia-diem/[slug]` | Chi tiết, gallery, đánh giá  |
| `/ban-do`          | Bản đồ địa danh có tọa độ    |
| `/tim-kiem`        | Tìm kiếm                     |
| `/ai-chat`         | Chat AI bằng text/ảnh        |
| `/hoi-dap`         | Hỏi đáp cộng đồng            |
| `/so-tay`          | Bộ sưu tập cá nhân           |
| `/tai-khoan`       | Tài khoản                    |
| `/admin`           | Quản trị                     |

Ảnh không hợp lệ hoặc không tải được sẽ không tạo thẻ ảnh lỗi trên giao diện.
Ảnh người dùng chọn cho AI được nén phía client trước khi upload.

## 4. Backend

Thư mục: `apps/api`

- NestJS 10 chạy trên Fastify
- Prisma quản lý dữ liệu PostgreSQL
- PostGIS hỗ trợ truy vấn địa điểm gần nhất
- JWT access/refresh token
- Swagger tại `/docs`
- Rate limiting và validation cho request

Các nhóm module chính:

- `places`, `regions`, `categories`
- `search`
- `auth`, `users`
- `favorites`, `collections`
- `reviews`, `qna`
- `admin-*`, `audit-log`
- `storage`
- `qdrant`, `gemini`, `ai`

## 5. Dữ liệu địa danh

Mỗi địa danh có tối thiểu:

- `locationKey`
- `slug`
- `name`
- `province`
- `description`
- `heroImageS3Key`
- `latitude`, `longitude` nếu đã xác minh
- `qdrantPlaceSlug`
- `isAiReady`

`sync-locations-from-s3.ts` đọc folder cấp một trong bucket, chuẩn hóa metadata
và upsert vào database. `sync-place-coordinates.ts` cập nhật tọa độ từ file JSON
đã kiểm tra.

API công khai lọc theo phạm vi Gia Lai của dự án. Các địa danh thuộc khu vực
Bình Định cũ được quản lý theo quy ước dữ liệu hành chính hiện tại của dự án.

## 6. Ảnh và cache

Bucket S3 không được gọi trực tiếp từ frontend. Backend sinh presigned URL với
thời hạn cấu hình bởi `S3_PRESIGNED_EXPIRES_IN`.

Để giảm số lần ký URL:

- URL được cache trong bộ nhớ.
- Cache tự làm mới trước khi URL hết hạn.
- `S3_PRESIGNED_CACHE_MAX_ENTRIES` giới hạn số entry, mặc định `2000`.

Regions và categories cũng được cache trong bộ nhớ với
`REFERENCE_DATA_CACHE_TTL_MS`, mặc định 5 phút.

Cache là tối ưu theo từng instance. Dữ liệu nguồn vẫn nằm trong database/S3 nên
không phụ thuộc cache để đảm bảo tính đúng đắn.

## 7. Tìm kiếm

Meilisearch cung cấp tìm kiếm nhanh và gợi ý. Khi Meilisearch không khả dụng,
backend có đường fallback PostgreSQL để tính năng tìm kiếm cơ bản vẫn hoạt động.

Sau khi thay đổi dữ liệu lớn:

```bash
pnpm --filter @vivu/api reindex:meili
```

## 8. AI Chat

Endpoint:

```text
POST /api/v1/ai/chat
Content-Type: multipart/form-data
```

Ba chế độ:

1. Text-only: truy vấn text collection, đưa context vào Gemini.
2. Image-only: truy vấn image collection và trả địa danh khớp.
3. Image + text: nhận diện địa danh trước, sau đó lọc text context theo
   `place_slug`.

Qdrant Cloud Inference chịu trách nhiệm embedding truy vấn. Backend không tải
model embedding local.

Gemini được yêu cầu:

- trả lời tiếng Việt;
- chỉ dựa trên context Qdrant;
- nói rõ khi thiếu dữ liệu;
- không tự bịa giá vé, giờ mở cửa hoặc địa chỉ.

Chi tiết triển khai xem [AI_DEPLOYMENT.md](AI_DEPLOYMENT.md).

## 9. Triển khai

Thứ tự khuyến nghị:

1. Cấu hình và deploy API.
2. Kiểm tra health, database, S3, Qdrant và Gemini.
3. Cấu hình `NEXT_PUBLIC_API_URL` cho web.
4. Deploy web.
5. Chạy smoke test các route chính và ba chế độ AI.

Production:

- Web: <https://vivu-web.vercel.app>
- API: <https://vivu-api.vercel.app>

## 10. Bảo mật

- Khóa AWS, Qdrant và Gemini chỉ nằm trong backend env.
- Không log secret, token hoặc nội dung `.env`.
- Presigned URL có thời hạn và không được lưu như URL vĩnh viễn.
- Upload ảnh có giới hạn dung lượng và loại MIME.
- Endpoint admin yêu cầu quyền phù hợp.

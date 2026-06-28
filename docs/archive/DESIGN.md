# Thiết kế hệ thống

## 1. Nguyên tắc

- Giữ giao diện rõ ràng, ưu tiên nội dung địa danh.
- Logo và brand name Vivu không thay đổi.
- Không render ảnh hỏng.
- Không hiển thị nội dung RAG dài như bài viết đầy đủ.
- Mọi dữ liệu địa danh trên frontend đến từ API.
- Loading, empty và error state phải được xử lý rõ ràng.

## 2. Luồng dữ liệu địa danh

```text
S3 folders
   |
   v
sync-locations-from-s3
   |
   v
PostgreSQL/PostGIS ----> Meilisearch
   |
   v
NestJS API
   |
   v
Next.js UI
```

Qdrant không nằm trong luồng hiển thị địa danh. Nó chỉ tham gia khi người dùng
gửi yêu cầu AI.

## 3. Mô hình frontend

### Trang chủ

- Hero: “Khám phá Gia Lai cùng Vivu”.
- CTA tới Explore và AI Chat.
- Chỉ dùng địa danh trả về từ API.

### Explore

- Card gồm ảnh hợp lệ, tên và mô tả ngắn.
- Search/filter dựa trên metadata backend.
- Không hiển thị bộ lọc Bắc/Trung/Nam của dữ liệu toàn quốc.
- Skeleton khi tải và thông báo thử lại khi API lỗi.

### Detail

- Tên, hero, mô tả, gallery và thông tin phân loại.
- Nút hỏi Vivu AI về địa danh hiện tại.
- Bản đồ chỉ xuất hiện khi tọa độ hợp lệ.
- Review và các action có thể tải độc lập với nội dung chính.

### Map

- Chỉ tạo marker cho địa danh có latitude/longitude hợp lệ.
- Không suy đoán tọa độ.
- Nếu không có dữ liệu, hiển thị trạng thái đang cập nhật.

### AI Chat

- Bubble người dùng bên phải, trợ lý bên trái.
- Textarea, upload, preview và nút gửi.
- Hiển thị answer, sources, places và matched images.
- Ảnh chọn từ máy được nén trước khi tạo `FormData`.
- Không tạo câu trả lời fake phía frontend.

## 4. Mô hình backend

### API layer

- Controller chịu trách nhiệm transport, validation và auth.
- Service điều phối nghiệp vụ.
- Repository/Prisma chịu trách nhiệm truy vấn dữ liệu.
- Storage service chuyển S3 key thành presigned URL.

### Tối ưu truy vấn

- Các truy vấn độc lập được chạy song song.
- Regions/categories được cache theo TTL.
- Presigned URL được cache và dedupe request đang xử lý.
- List endpoint phải có giới hạn `pageSize`; client không yêu cầu số lượng vô
  hạn.

### AI pipeline

```text
multipart request
   |
InputRouter
   |-------------------|
   v                   v
Text pipeline       Image pipeline
   |                   |
Qdrant Cloud        Qdrant Cloud
   |                   |
Gemini (nếu cần)    place match
   |-------------------|
   v
ResponseFormatter
```

Image + text nhận diện ảnh trước. Chỉ khi điểm khớp đạt ngưỡng mới dùng
`place_slug` để giới hạn text context.

## 5. Contract ảnh

- Database lưu S3 key.
- API trả URL đã ký có thời hạn.
- Frontend coi URL ảnh là dữ liệu có thể hết hạn.
- Ảnh lỗi bị ẩn hoặc thay bằng placeholder nhẹ tùy ngữ cảnh.
- Không lưu presigned URL ngược vào database.

## 6. Error handling

- API dùng mã HTTP phù hợp và payload lỗi ổn định.
- Frontend không hiển thị stack trace hoặc secret.
- Lỗi của review/action phụ không được làm hỏng toàn bộ detail page.
- AI phân biệt lỗi input, lỗi retrieval và lỗi model.

## 7. Accessibility và responsive

- Điều khiển có label hoặc `aria-label`.
- Có trạng thái focus bằng bàn phím.
- Ảnh nội dung có `alt`; ảnh trang trí dùng alt rỗng.
- Chat composer và card grid hoạt động trên mobile.
- Màu chữ/trạng thái lỗi có độ tương phản đủ.

## 8. Quy ước thay đổi

- Ưu tiên pattern đã có trong repo.
- Không thêm abstraction nếu không giảm độ phức tạp thực tế.
- Thay đổi shared contract phải cập nhật `packages/types`.
- Thay đổi env phải cập nhật `.env.example` và tài liệu.
- Thay đổi có ảnh hưởng người dùng phải có test hoặc smoke test tương ứng.

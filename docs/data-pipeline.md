# Quy trình xử lý & Đồng bộ dữ liệu (Data Pipeline & Syncing Architecture)

Tài liệu này trình bày chi tiết kiến trúc dữ liệu của Vivu, các mô hình lưu trữ, cơ chế đồng bộ hóa định kỳ và xử lý dự phòng lỗi.

---

## 1. Kiến trúc lưu trữ đa tầng (Multi-tier Storage Architecture)

Hệ thống Vivu phân rã dữ liệu thành nhiều tầng lưu trữ chuyên biệt để tối ưu hóa hiệu năng truy vấn, khả năng mở rộng và chi phí vận hành:

```
┌────────────────────────────────────────────────────────┐
│                    Dữ liệu nghiệp vụ                   │
│               [ PostgreSQL / PostGIS (Neon) ]          │
│  - Danh sách địa danh, mô tả, danh mục, khu vực.       │
│  - Tọa độ địa lý (Geometry/Point), đánh giá (Reviews). │
│  - Lead khách hàng, báo lỗi dữ liệu (Reports).         │
└──────────────────────────┬─────────────────────────────┘
                           │
             (Đồng bộ định kỳ hoặc kích hoạt tay)
                           │
         ┌─────────────────┴─────────────────┐
         v                                   v
┌──────────────────┐               ┌──────────────────┐
│   Meilisearch    │               │   Qdrant Cloud   │
│ (Search Engine)  │               │ (Vector Database)│
│ Chỉ mục tìm kiếm │               │ Vector embeddings│
│ nhanh, typo-safe │               │ phục vụ RAG AI   │
└──────────────────┘               └──────────────────┘
```

---

## 2. Luồng xử lý và Lưu trữ hình ảnh (Media Pipeline)

Để đảm bảo tính riêng tư của dữ liệu và tối ưu hóa băng thông, luồng xử lý hình ảnh tuân thủ quy trình sau:

1.  **Lưu trữ**: Ảnh gốc được lưu trữ trên **AWS S3** với cấu hình **Block All Public Access**. Dữ liệu trong database chỉ lưu lại S3 Key (Ví dụ: `places/bien-ho/hero.jpg`), không lưu URL đầy đủ.
2.  **Truy xuất (Presigned URLs)**:
    - Khi client yêu cầu thông tin địa danh, backend sẽ sinh ra một đường dẫn tạm thời (Presigned URL) sử dụng AWS SDK.
    - URL này có thời hạn sống (TTL) ngắn (mặc định `3600` giây). Sau thời gian này, link sẽ tự động vô hiệu hóa.
3.  **Tối ưu hóa hiệu năng (Caching)**:
    - Việc sinh Presigned URL trên mỗi request sẽ làm tăng độ trễ (latency) và tốn tài nguyên. API backend sử dụng thư viện cache trong bộ nhớ (Memory Cache) để lưu trữ các URL đã được ký.
    - Trước khi ký một ảnh mới, backend kiểm tra trong cache. Nếu tồn tại và thời gian sống còn lại lớn hơn 5 phút, backend trả về URL từ cache.
    - Cấu hình `S3_PRESIGNED_CACHE_MAX_ENTRIES` giới hạn số lượng ảnh được cache trong RAM để tránh tràn bộ nhớ.

---

## 3. Quy trình đồng bộ hóa (Data Syncing Process)

Hệ thống cung cấp các CLI Command (viết bằng NestJS Console/Command module) để đồng bộ hóa dữ liệu thủ công hoặc tự động qua Cron Job:

### A. Lệnh `sync:locations` (Đồng bộ địa danh từ S3)

- **Mục đích**: Đồng bộ cấu trúc thư mục hình ảnh trên S3 vào database PostgreSQL.
- **Hoạt động**:
  1.  API kết nối tới AWS S3, quét toàn bộ danh mục thư mục cấp một trong bucket chỉ định.
  2.  Phân tích tên thư mục để sinh ra `locationKey` và `slug` (Ví dụ: thư mục `BIEN_HO` tương ứng với `locationKey=BIEN_HO` và `slug=bien-ho`).
  3.  Đọc file metadata cấu hình nằm trong từng thư mục (nếu có) để cập nhật tên tiếng Việt chuẩn hóa, danh mục và mô tả vào bảng `Place` trong PostgreSQL dưới dạng câu lệnh UPSERT (cập nhật nếu đã tồn tại, tạo mới nếu chưa có).

### B. Lệnh `sync:coordinates` (Đồng bộ tọa độ địa lý)

- **Mục đích**: Cập nhật tọa độ GPS chính xác cho các địa danh đã được phê duyệt.
- **Hoạt động**:
  1.  Script đọc dữ liệu từ tệp cấu hình JSON tĩnh được quản lý trong mã nguồn (đã qua kiểm chứng thực tế).
  2.  Thực hiện cập nhật vĩ độ (`latitude`) và kinh độ (`longitude`) cho các địa danh khớp slug trong database.
  3.  Sử dụng hàm PostGIS `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)` để sinh dữ liệu hình học (Geometry/Point) lưu trữ vào cột tọa độ địa lý phục vụ cho việc tính khoảng cách lân cận.

### C. Lệnh `reindex:meili` (Đồng bộ chỉ mục tìm kiếm)

- **Mục đích**: Đồng bộ hóa dữ liệu từ PostgreSQL sang Meilisearch.
- **Hoạt động**:
  1.  Xóa toàn bộ chỉ mục (index) cũ trên Meilisearch.
  2.  Truy vấn toàn bộ danh sách địa danh đang được kích hoạt hiển thị trong PostgreSQL.
  3.  Đẩy dữ liệu dạng JSON sang Meilisearch để tạo chỉ mục mới, thiết lập các thuộc tính tìm kiếm nhanh, thuộc tính lọc (filterable attributes) và thuộc tính sắp xếp (sortable attributes).

---

## 4. Chế độ dự phòng tìm kiếm (Search Fallback mechanism)

Để đảm bảo tính liên tục của dịch vụ (High Availability):

- Khi người dùng thực hiện tìm kiếm, API gửi request đến Meilisearch.
- Nếu kết nối đến Meilisearch bị lỗi (Timeout, Server down...), hệ thống sẽ bắt lỗi (catch error), ghi nhận nhật ký cảnh báo và tự động chuyển đổi sang chế độ truy vấn trực tiếp trên PostgreSQL:
  ```sql
  SELECT * FROM "Place"
  WHERE "name" ILIKE %query%
     OR "description" ILIKE %query%
  LIMIT 20;
  ```
- Khi Meilisearch hoạt động trở lại, hệ thống sẽ tự động chuyển về sử dụng Meilisearch mà không cần khởi động lại API server.

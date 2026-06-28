# Kiến trúc chi tiết hệ thống Vivu (System Architecture & Flows)

Tài liệu này mô tả chi tiết thiết kế kiến trúc phần mềm, cấu trúc dữ liệu, các luồng dữ liệu nghiệp vụ và thiết kế triển khai của hệ thống Vivu.

---

## 1. Sơ đồ kiến trúc & Thành phần hệ thống

Hệ thống được tổ chức dưới dạng monorepo quản lý bằng `pnpm workspaces` và điều phối build bằng `Turborepo` để đảm bảo tính tái sử dụng mã nguồn (shared types, packages) và tối ưu hóa thời gian build.

```
       [ Client Browser (Next.js 14 App Router / next-intl / Leaflet Map) ]
                                    │
                       (Cookie Auth, File Uploads)
                                    │
                                    v
                         [ Web Next.js Proxy Routes ]
                                    │
                          (JSON API / CORS Headers)
                                    │
                                    v
                   [ API Backend Gateway (NestJS / Fastify) ]
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │ (Prisma Client)         │ (REST HTTP / Axios)     │ (AWS SDK v3)
          v                         v                         v
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ PostgreSQL/PostGIS│      │    Meilisearch   │      │      AWS S3      │
│  (Neon DB Cloud) │      │  (Managed Host)  │      │ (Private Bucket) │
└──────────────────┘      └──────────────────┘      └──────────────────┘
          │                                                   │
          │ (Metadata filter)                                 │ (Presigned URL)
          └─────────────────────────┬─────────────────────────┘
                                    │
                                    ├─────────────────────────┐
                                    │ (Qdrant SDK)            │ (Google AI SDK)
                                    v                         v
                          ┌──────────────────┐      ┌──────────────────┐
                          │   Qdrant Cloud   │      │   Google Gemini  │
                          │(Inference Engine)│      │  (Gemini Flash)  │
                          └──────────────────┘      └──────────────────┘
```

### Chi tiết vai trò các thành phần hạ tầng:
*   **Next.js (Web)**: Đảm nhận phần hiển thị giao diện, tối ưu hóa SEO (Server-Side Rendering cho trang địa danh chi tiết), và thực hiện đa ngôn ngữ hóa thông qua `next-intl`. Next.js Route Handlers cũng đóng vai trò same-origin proxy để che giấu endpoint API thật của backend khỏi browser và đính kèm JWT session cookie một cách an toàn.
*   **NestJS (API)**: Xây dựng trên nền tảng Fastify (cho hiệu năng cao hơn Express), quản lý xác thực bằng JWT, kiểm soát lưu lượng (rate limiting), điều phối các luồng nghiệp vụ kinh doanh và kết nối tới các dịch vụ Cloud bên thứ ba.
*   **Neon Database (PostgreSQL)**: Cơ sở dữ liệu quan hệ, tích hợp extension không gian địa lý **PostGIS** để tính toán khoảng cách địa lý thực tế giữa các tọa độ địa danh phục vụ cho tính năng tìm địa điểm lân cận (`places/nearby`).
*   **Meilisearch**: Công cụ tìm kiếm dạng full-text search siêu nhanh với độ trễ cực thấp, cung cấp gợi ý từ khóa tìm kiếm (typo tolerance) ngay khi người dùng gõ ký tự đầu tiên.
*   **AWS S3**: Hệ thống lưu trữ đối tượng dạng private bucket, giữ toàn bộ ảnh gốc và các ảnh chất lượng cao của địa điểm du lịch.
*   **Qdrant Cloud**: Vector database đám mây. Sử dụng dịch vụ **Cloud Inference** của Qdrant để sinh embeddings (chuyển đổi văn bản/hình ảnh thành vector số) mà backend không cần tự chạy hoặc tải các thư viện local như Torch, HuggingFace Transformers, BGE-M3 hay SigLIP.
*   **Google Gemini**: Mô hình ngôn ngữ lớn (LLM) `gemini-2.5-flash` nhận nhiệm vụ tổng hợp thông tin từ context được cung cấp để trả lời câu hỏi và tự động lên lịch trình du lịch cá nhân hóa.

---

## 2. Chi tiết các luồng xử lý yêu cầu (Sequence Requests Flows)

### A. Luồng tải trang chi tiết địa danh (`GET /dia-diem/[slug]`)
```
Browser                     Next.js SSR                    NestJS API                    PostgreSQL
   │                             │                             │                             │
   │─── Truy cập URL ───────────>│                             │                             │
   │                             │─── GET /api/v1/places/:slug>│                             │
   │                             │                             │─── Tìm theo slug ──────────>│
   │                             │                             │<── Trả dữ liệu Địa danh ────│
   │                             │                             │                             │
   │                             │─── Sinh Presigned S3 URLs ─>│                             │
   │                             │    (Đọc cache/Ký mới S3)    │                             │
   │                             │<── Trả về URLs ảnh đã ký ───│                             │
   │                             │                             │                             │
   │                             │─── Render HTML (SSR) ───────│                             │
   │                             │    kèm TouristAttraction    │                             │
   │                             │    JSON-LD Metadata         │                             │
   │<── Nhận trang HTML hoàn chỉnh│                             │                             │
```

1.  **Duyệt trang**: Khi người dùng mở trang địa danh, Next.js thực hiện Server-Side Rendering (SSR) để tối ưu công cụ tìm kiếm (SEO).
2.  **Truy vấn dữ liệu**: Next.js gọi API `GET /api/v1/places/:slug`.
3.  **Ký ảnh S3**: API kiểm tra danh sách ảnh của địa danh lưu dạng S3 key trong database, gọi AWS SDK sinh Presigned URL với thời hạn sống ngắn (TTL). Các URL này được cache ở API memory để tránh gọi AWS liên tục.
4.  **Tạo Metadata SEO**: Trang HTML trả về trình duyệt chứa đầy đủ thẻ SEO Meta và cấu trúc JSON-LD (TouristAttraction và Breadcrumb) để Google Bot dễ dàng thu thập chỉ mục.

---

### B. Luồng Tìm kiếm lai (Hybrid Search & Fallback Flow)
```
Browser                        NestJS API                     Meilisearch                    PostgreSQL
   │                               │                              │                              │
   │─── Nhập từ khóa tìm kiếm ────>│                              │                              │
   │                               │─── Gửi query tìm kiếm ──────>│                              │
   │                               │<── Trả kết quả gợi ý nhanh ──│                              │
   │                               │ (Nếu Meilisearch LỖI/TIMOUT) │                              │
   │                               │─── Fallback: Truy vấn ILIKE ───────────────────────────────>│
   │                               │<── Trả kết quả tìm kiếm cơ bản ─────────────────────────────│
   │<── Hiển thị kết quả tìm kiếm ─│                              │                              │
```

1.  **Gõ tìm kiếm**: Người dùng nhập từ khóa vào ô tìm kiếm.
2.  **Tìm kiếm chính**: API chuyển tiếp query sang Meilisearch. Meilisearch trả về kết quả gần đúng kèm sửa lỗi chính tả.
3.  **Cơ chế dự phòng**: Nếu Meilisearch bị lỗi kết nối hoặc tắt đột ngột, API tự động chuyển hướng truy vấn sang PostgreSQL thông qua câu lệnh SQL truy vấn so khớp mẫu `ILIKE` với cột tên và mô tả địa danh.

---

### E. Luồng xử lý AI Chat (RAG Reranking & Text/Vision Pipeline)
Hệ thống AI Chat được thiết kế với cơ chế bảo vệ phân cấp nghiêm ngặt nhằm tránh việc lạm dụng API và sinh ra thông tin không chính xác.

```
Browser                       NestJS API                 Qdrant Cloud                Google Gemini
   │                               │                           │                           │
   │─── POST /ai/chat (Text/Img) ─>│                           │                           │
   │    (Client nén ảnh < 700KB)   │                           │                           │
   │                               │─── Sinh Embeddings ──────>│                           │
   │                               │    (Text hoặc Vision)     │                           │
   │                               │<── Trả Vector/Khớp ảnh ───│                           │
   │                               │                           │                           │
   │                               │─── Lấy RAG Context ──────>│                           │
   │                               │    (Lọc theo place_slug)  │                           │
   │                               │<── Trả dữ liệu Context ───│                           │
   │                               │                           │                           │
   │                               │─── Gửi System Prompt + Ngữ cảnh ─────────────────────>│
   │                               │    (Ép buộc trả lời tiếng Việt, không bịa thông tin)  │
   │                               │<────────────────────────────────── Trả về phản hồi AI─│
   │<── Trả về câu trả lời dạng JSON│                           │                           │
```

1.  **Nén ảnh ở client**: Nếu có hình ảnh đi kèm, trình duyệt sử dụng thư viện xử lý canvas của Client để nén kích thước ảnh xuống dưới 700 KB trước khi chuyển thành `FormData` và gửi đi.
2.  **Phân tích đầu vào**: NestJS API chặn request, kiểm tra loại file và giới hạn kích thước đầu vào.
3.  **Tạo Embeddings & Query Vector**:
    *   *Với Text*: API gọi Qdrant Cloud Inference để sinh vector tương ứng của câu hỏi, thực hiện tìm kiếm vector tương đồng trên collection `text_collection_cloud`.
    *   *Với Image*: API gọi Qdrant Cloud Inference sử dụng model vision (`qdrant/clip-vit-b-32-vision`) để tính toán độ tương đồng ảnh. Nếu tìm thấy ảnh địa danh khớp với độ tin cậy lớn hơn `IMAGE_MATCH_THRESHOLD` (0.25), API sẽ gán `place_slug` tương ứng của địa danh đó.
4.  **RAG Reranking & Context Filtering**: Nếu là truy vấn kết hợp (Image + Text), hệ thống sẽ dùng `place_slug` tìm được để làm filter thu hẹp không gian tìm kiếm, chỉ lấy các đoạn context thuộc về địa danh đó trong Qdrant.
5.  **Chỉ thị nghiêm ngặt cho Gemini**: API tổng hợp prompt với định hướng bắt buộc:
    *   Chỉ trả lời dựa trên context được cung cấp từ Qdrant.
    *   Nếu context không đủ thông tin, bắt buộc nói: *"Tôi không có đủ thông tin chi tiết về nội dung này..."*.
    *   Tuyệt đối không tự bịa đặt giá vé, giờ mở cửa hoặc số điện thoại liên hệ.
    *   Trả lời bằng tiếng Việt.
6.  **Trả kết quả**: Phản hồi từ Gemini được gửi về cho Next.js để hiển thị trực tiếp cho người dùng.

---

## 3. Bản đồ triển khai (Deployment Architecture)

Hạ tầng production được cấu hình hoàn toàn trên các dịch vụ đám mây Serverless và Managed Services:
*   **Web & API Hosting**: Triển khai trên **Vercel** dưới dạng Serverless Functions (NestJS chạy Fastify tương thích với Vercel API routes thông qua custom entrypoint).
*   **Neon DB**: Triển khai cơ sở dữ liệu PostgreSQL Serverless tại khu vực `ap-southeast-1` (Singapore) để tối thiểu hóa độ trễ kết nối đến Vercel. Database sử dụng cơ chế tự động tạm dừng (auto-suspend) cho môi trường test để tối ưu chi phí và tự động co giãn cấu hình (autoscaling) trên production.
*   **Search Engine**: Meilisearch được triển khai độc lập trên VPS được cấu hình bảo mật firewall chặt chẽ, chỉ cho phép địa chỉ IP của backend kết nối đến cổng API Master Key.
*   **Dịch vụ AI**: Qdrant Cloud và Google AI Studio (Gemini) cung cấp API endpoint bảo mật bằng key lưu trong Vercel Environment Variables.

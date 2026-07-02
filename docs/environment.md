# Quản lý Biến Môi Trường (Environment Variables Specification)

Tài liệu này cung cấp mô tả chi tiết, giá trị mặc định, mục đích sử dụng và các cân nhắc an toàn bảo mật đối với từng biến môi trường trong dự án Vivu.

---

## 1. Nguyên tắc quản lý biến môi trường

*   **Tách biệt môi trường**: Tuyệt đối không sử dụng chung database credentials hoặc API keys giữa môi trường Local, Staging và Production.
*   **Bảo vệ Key ở Client**: Trình duyệt có thể đọc bất kỳ biến nào có tiền tố `NEXT_PUBLIC_`. Chỉ đặt tiền tố này cho các biến không nhạy cảm (API URLs, support email, social links). Các khóa AWS, Gemini, Qdrant, JWT secret **phải** được giữ bí mật và chỉ cấu hình ở backend.
*   **Tránh Hard-code**: Mọi cấu hình có khả năng thay đổi tùy theo môi trường triển khai đều phải được đưa ra biến môi trường.

---

## 2. Danh sách biến cấu hình Backend (`apps/api/.env`)

### A. Cơ sở dữ liệu (PostgreSQL)
*   **`DATABASE_URL`**
    *   *Mô tả*: URL kết nối cơ sở dữ liệu chính. Trên production (Neon DB), biến này nên sử dụng pooled connection (qua cổng 5432 hoặc 6543 của Neon Pooler) để tránh vượt quá giới hạn connection trong kiến trúc Serverless.
    *   *Định dạng*: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`
    *   *Môi trường*: Bắt buộc ở cả Local và Prod.
*   **`DIRECT_DATABASE_URL`**
    *   *Mô tả*: URL kết nối trực tiếp đến cơ sở dữ liệu, không đi qua connection pooler. Prisma bắt buộc dùng biến này khi chạy các lệnh di chuyển schema (migrations) để tránh lỗi transaction lock.
    *   *Môi trường*: Bắt buộc ở cả Local và Prod.

### B. Xác thực & Phân quyền (Security & JWT)
*   **`JWT_ACCESS_SECRET`**
    *   *Mô tả*: Khóa bí mật dùng để ký và xác thực mã Access Token của người dùng. Cần sử dụng một chuỗi ngẫu nhiên có độ bảo mật cao.
    *   *Khuyến nghị*: Tạo bằng lệnh `openssl rand -base64 48`.
*   **`JWT_REFRESH_SECRET`**
    *   *Mô tả*: Khóa bí mật dùng để ký Refresh Token. Được lưu trữ dưới dạng mã hóa một chiều (hash) trong database để đối chiếu khi người dùng làm mới phiên làm việc.
*   **`ABUSE_HASH_SECRET`**
    *   *Mô tả*: Khóa muối (salt) dùng để hash địa chỉ IP hoặc session ID của người dùng trước khi ghi nhận lượt sử dụng AI hoặc Rate Limit, nhằm bảo vệ thông tin cá nhân (GDPR compliance).

### C. AWS S3 Storage (Quản lý hình ảnh)
*   **`AWS_ACCESS_KEY_ID`** & **`AWS_SECRET_ACCESS_KEY`**
    *   *Mô tả*: Thông tin định danh tài khoản AWS IAM có quyền truy cập vào S3 Bucket của dự án.
    *   *Quyền hạn yêu cầu*: Cần cấu hình chính sách (Policy) giới hạn tài khoản này chỉ có quyền `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` trên bucket chỉ định, không cấp quyền xóa đối tượng nếu không cần thiết.
*   **`AWS_REGION`**
    *   *Mô tả*: Phân vùng máy chủ AWS đặt bucket (Ví dụ: `ap-southeast-1` cho Singapore).
*   **`AWS_BUCKET_NAME`**
    *   *Mô tả*: Tên S3 Bucket lưu trữ ảnh địa danh.
*   **`S3_PRESIGNED_EXPIRES_IN`**
    *   *Mô tả*: Thời gian tồn tại của đường dẫn ảnh Presigned URL tính bằng giây (Mặc định: `3600` - 1 giờ).
*   **`S3_PRESIGNED_CACHE_MAX_ENTRIES`**
    *   *Mô tả*: Số lượng Presigned URL tối đa được cache trong RAM của API server nhằm giảm tải việc gọi sang AWS (Mặc định: `2000`).

### D. Google Gemini API (Trí tuệ nhân tạo)
*   **`GEMINI_API_KEY`**
    *   *Mô tả*: Khóa API kết nối dịch vụ Google AI Studio.
*   **`GEMINI_MODEL`**
    *   *Mô tả*: Tên mô hình Gemini được sử dụng (Mặc định: `gemini-2.5-flash` để tối ưu chi phí và tốc độ).
*   **`GEMINI_TIMEOUT_MS`**
    *   *Mô tả*: Thời gian chờ tối đa khi gọi API Gemini trước khi tự động ngắt và kích hoạt cơ chế fallback (Mặc định: `30000` - 30 giây).

### E. Qdrant Cloud (Vector Database)
*   **`QDRANT_URL`**
    *   *Mô tả*: Endpoint kết nối dịch vụ Qdrant Cloud Cluster.
*   **`QDRANT_API_KEY`**
    *   *Mô tả*: Khóa API xác thực quyền đọc/ghi vào Vector Cluster.
*   **`QDRANT_TEXT_COLLECTION`**
    *   *Mô tả*: Tên collection lưu trữ dữ liệu vector văn bản (Mặc định: `text_collection_cloud`).
*   **`QDRANT_IMAGE_COLLECTION`**
    *   *Mô tả*: Tên collection lưu trữ dữ liệu vector hình ảnh (Mặc định: `image_collection_cloud`).

### F. Cloudflare Turnstile (Chống Spam)
*   **`TURNSTILE_ENABLED`**
    *   *Mô tả*: Bật/tắt kiểm tra bảo mật Turnstile (`true` hoặc `false`).
*   **`TURNSTILE_SECRET_KEY`**
    *   *Mô tả*: Khóa bí mật Cloudflare Turnstile cấp cho backend để xác thực token gửi lên từ client.

### G. Quota & Feature Flags
*   **`AI_FEATURE_ENABLED`**
    *   *Mô tả*: Cờ kích hoạt tính năng chat AI. Nếu đặt `false`, hệ thống sẽ tắt chatbot và trả về lỗi 503.
*   **`TRIP_PLANNER_FEATURE_ENABLED`**
    *   *Mô tả*: Cờ kích hoạt tính năng tạo lịch trình AI. Nếu đặt `false`, hệ thống sẽ tắt luồng sinh lịch trình và gợi ý người dùng gửi form tư vấn thủ công.

---

## 3. Danh sách biến cấu hình Frontend (`apps/web/.env.local`)

### A. API Connection
*   **`NEXT_PUBLIC_API_URL`**
    *   *Mô tả*: Endpoint API công khai để client browser gửi request trực tiếp (Ví dụ: `http://localhost:4000` khi phát triển local hoặc `https://vivu-api.vercel.app` trên production).
*   **`API_INTERNAL_URL`**
    *   *Mô tả*: Endpoint API dùng cho các truy vấn Server-Side Rendering (SSR) trong Next.js. Nếu Next.js và API triển khai trong cùng một mạng nội bộ, hãy dùng địa chỉ IP nội bộ để tối ưu tốc độ.

### B. SEO & CDN
*   **`NEXT_PUBLIC_SITE_URL`**
    *   *Mô tả*: Tên miền canonical chính thức của trang web để sinh sitemap và cấu hình đường dẫn tuyệt đối cho SEO Meta Tags (Ví dụ: `https://vivu-web.vercel.app`).
*   **`NEXT_IMAGE_REMOTE_HOSTS`**
    *   *Mô tả*: Danh sách các hostname được phép tải ảnh qua Next Image Component, ngăn chặn tấn công SSRF qua thẻ ảnh.
    *   *Giá trị đề xuất*: `res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com`

### C. Security & Support
*   **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`**
    *   *Mô tả*: Khóa công khai của Cloudflare Turnstile hiển thị widget bảo mật trên giao diện.
*   **`NEXT_PUBLIC_SUPPORT_EMAIL`**
    *   *Mô tả*: Địa chỉ email hiển thị tại các trang Liên hệ, Điều khoản dịch vụ.

---

## 4. Auth architecture notes

Vivu currently uses first-party authentication managed by the NestJS API.
`User`, `Role` (`user`, `editor`, `admin`), password hashes, and refresh-token
rows live in Neon/PostgreSQL. The frontend calls its own Next.js route handlers
under `/api/auth/*`, and those route handlers proxy to the NestJS auth endpoints.

There are no required frontend or backend environment variables for an external
hosted auth user store. Future Google sign-in should add provider credentials
only when the self-managed OAuth flow is implemented, for example
`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, and should keep Neon/PostgreSQL as
the source of truth for users and roles.

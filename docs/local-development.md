# Hướng dẫn Chạy & Phát triển dự án dưới Local (Local Development Guide)

Tài liệu này cung cấp hướng dẫn từng bước để thiết lập, chạy và phát triển dự án Vivu dưới môi trường máy tính cá nhân.

---

## 1. Yêu cầu tiên quyết (System Prerequisites)

Đảm bảo máy tính của bạn đã được cài đặt đầy đủ các phần mềm sau:
*   **Node.js**: Phiên bản **20.x LTS** trở lên. Bạn có thể kiểm tra bằng lệnh `node -v`. Khuyên dùng công cụ `nvm` để quản lý phiên bản Node.
*   **pnpm**: Phiên bản **9.x** trở lên. Cài đặt toàn cục bằng lệnh:
    ```bash
    npm install -g pnpm@9
    ```
*   **Docker Desktop**: Bắt buộc để khởi chạy database PostgreSQL (tích hợp PostGIS) và Meilisearch cục bộ. Đảm bảo Docker Daemon đang hoạt động.
*   **Git**: Để clone repo và theo dõi lịch sử commit.

---

## 2. Các bước cài đặt cơ bản (Step-by-Step Setup)

### Bước 1: Clone repo và tải dependencies
```bash
git clone https://github.com/dinhvien04/vivu.git
cd vivu
pnpm install
```

### Bước 2: Thiết lập môi trường Docker
Khởi động cơ sở dữ liệu PostgreSQL (có PostGIS) và dịch vụ Meilisearch thông qua Docker Compose ở chế độ nền (detached mode):
```bash
docker compose up -d db meilisearch
```
Kiểm tra trạng thái các container đang chạy:
```bash
docker ps
```
Bạn sẽ thấy 2 container hoạt động tại các cổng:
*   PostgreSQL: `localhost:5432`
*   Meilisearch: `localhost:7700`

---

## 3. Các kịch bản phát triển cục bộ

Tùy vào mục tiêu công việc, bạn hãy chọn một trong hai cách chạy sau:

### Cách 1: Chỉ chạy Frontend Web (Gọi API Production)
Cách này phù hợp khi bạn cần tinh chỉnh CSS, cập nhật giao diện, SEO, viết component hoặc dịch đa ngôn ngữ mà không cần quan tâm đến backend database local.

1.  Tạo file `apps/web/.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
    API_INTERNAL_URL=https://vivu-api.vercel.app
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=
    NEXT_IMAGE_REMOTE_HOSTS=res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com
    ```
2.  Khởi chạy web dev server:
    ```bash
    pnpm --filter @vivu/web dev
    ```
3.  Mở trình duyệt truy cập: `http://localhost:3000`. Khi bạn chỉnh sửa mã nguồn trong thư mục `apps/web/src/`, trang web sẽ tự động reload (Hot Module Replacement).

---

### Cách 2: Chạy Full Local (Frontend + Backend + DB)
Cách này phù hợp khi bạn cần xây dựng API mới, thay đổi cấu trúc bảng database, viết thêm script đồng bộ dữ liệu hoặc kiểm thử toàn trình hệ thống.

1.  **Thiết lập file cấu hình môi trường**:
    *   **Trên Windows (PowerShell)**:
        ```powershell
        Copy-Item apps/api/.env.example apps/api/.env
        Copy-Item apps/web/.env.example apps/web/.env.local
        ```
    *   **Trên Unix / macOS (Terminal)**:
        ```bash
        cp apps/api/.env.example apps/api/.env
        cp apps/web/.env.example apps/web/.env.local
        ```

2.  **Chỉnh sửa biến môi trường cục bộ**:
    *   Mở file `apps/api/.env` và đảm bảo thông tin kết nối database trỏ về localhost:
        ```env
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vivu?schema=public"
        DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vivu?schema=public"
        ```
    *   Mở file `apps/web/.env.local` và trỏ API về server local:
        ```env
        NEXT_PUBLIC_API_URL=http://localhost:4000
        API_INTERNAL_URL=http://localhost:4000
        ```

3.  **Khởi tạo cơ sở dữ liệu cục bộ**:
    Chạy script thiết lập database để kích hoạt extension PostGIS, đẩy schema Prisma lên database và sinh Prisma Client:
    ```bash
    pnpm --filter @vivu/api db:setup
    pnpm --filter @vivu/api prisma:generate
    ```

4.  **Chạy toàn bộ hệ thống ở chế độ Dev**:
    ```bash
    pnpm dev
    ```
    Lệnh này sử dụng công cụ Turborepo để song song chạy cả backend (cổng `4000`) và frontend (cổng `3000`).

---

## 4. Các script đồng bộ dữ liệu quan trọng (Syncing Scripts)

Khi chạy full local lần đầu tiên, cơ sở dữ liệu của bạn sẽ trống. Hãy chạy các script sau để nạp dữ liệu:

*   **Đồng bộ danh sách địa danh & ảnh từ S3**:
    Script này sẽ quét thư mục trên S3 bucket, tạo các bản ghi địa danh tương ứng trong PostgreSQL:
    ```bash
    pnpm --filter @vivu/api sync:locations
    ```
*   **Đồng bộ tọa độ bản đồ**:
    Cập nhật tọa độ thực tế của địa danh từ file JSON cấu hình cục bộ vào database:
    ```bash
    pnpm --filter @vivu/api sync:coordinates
    ```
*   **Tái thiết lập chỉ mục Meilisearch**:
    Đẩy toàn bộ địa điểm từ DB local sang Meilisearch local để hỗ trợ tính năng gợi ý tìm kiếm:
    ```bash
    pnpm --filter @vivu/api reindex:meili
    ```

---

## 5. Chạy Kiểm thử cục bộ (Local Testing)

Đảm bảo chất lượng mã nguồn trước khi tạo Pull Request:
*   **Linter & Code Formatting**: `pnpm lint`
*   **Type Checking**: `pnpm typecheck`
*   **Backend Unit Tests**: `pnpm --filter @vivu/api test`
*   **Backend Integration Tests**: `pnpm --filter @vivu/api test:int` (Yêu cầu Docker database đang chạy).
*   **Frontend E2E Playwright Tests**:
    ```bash
    E2E_BASE_URL=http://localhost:3000 pnpm e2e:web
    ```
---

## 6. Local Clerk Auth Setup

Clerk is optional for local development. If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
is empty, the web app keeps the legacy local auth fallback so existing smoke
tests and dev flows still work.

The visible `/dang-nhap` and `/dang-ky` screens use Clerk's prebuilt forms
inside a Vivu shell. Locale `vi` loads Clerk `viVN`; locale `en` keeps Clerk's
default English. Vivu roles are still read from `/api/v1/auth/me` and the
Postgres `User.role` column, not from Clerk client metadata.

To test Clerk locally:

1. Create a Clerk application and set these values:
   ```env
   # apps/web/.env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/dang-nhap
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/dang-ky
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/tai-khoan

   # apps/api/.env
   CLERK_SECRET_KEY=sk_test_...
   CLERK_JWT_KEY=
   CLERK_WEBHOOK_SECRET=whsec_...
   CLERK_ALLOWED_ORIGINS=http://localhost:3000
   ```
2. Run the migration before testing against an existing DB:
   ```bash
   pnpm --filter @vivu/api prisma migrate deploy
   pnpm --filter @vivu/api prisma:generate
   ```
3. Start API and web, sign in through `/dang-nhap`, then confirm
   `GET /api/v1/auth/me` returns a DB user with `clerkUserId` and `role`.
4. For webhooks, expose the API with a tunnel and configure Clerk to call:
   `https://<tunnel>/api/v1/webhooks/clerk`.

# Hướng dẫn Khắc phục Sự cố Toàn diện (Comprehensive Troubleshooting Playbook)

Tài liệu này tổng hợp toàn bộ các lỗi thường gặp trong quá trình phát triển (Local Development) và vận hành (Production Operation) hệ thống Vivu, cung cấp nguyên nhân gốc rễ và quy trình khắc phục từng bước.

---

## 1. Sự cố phát triển Local (Local Development Issues)

### A. Frontend báo lỗi 500 khi mở trang chi tiết địa danh
*   **Triệu chứng**: Khi click vào một địa danh trên local web (`localhost:3000`), trình duyệt hiển thị màn hình lỗi 500 của Next.js (Internal Server Error) hoặc console báo lỗi `Failed to fetch`.
*   **Nguyên nhân gốc rễ**:
    1.  Biến `NEXT_PUBLIC_API_URL` trong file `apps/web/.env.local` đang trỏ đến `http://localhost:4000` nhưng API Backend NestJS chưa được khởi động hoặc bị crash.
    2.  Nếu bạn đang chạy web local kết nối với API production (`https://vivu-api.vercel.app`), có thể địa chỉ IP local của bạn bị chặn bởi Cloudflare rate limits hoặc API key bị hết hạn.
*   **Quy trình khắc phục**:
    1.  Kiểm tra xem API backend local có đang chạy không bằng cách truy cập `http://localhost:4000/api/v1/healthz`.
    2.  Nếu trang healthz báo lỗi, hãy mở terminal chạy API và kiểm tra log lỗi khởi động:
        ```bash
        pnpm --filter @vivu/api dev
        ```
    3.  Nếu không muốn chạy API local, hãy đổi cấu hình trong file `apps/web/.env.local` sang trỏ về production API và khởi động lại dev server:
        ```env
        NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
        ```

---

### B. Lỗi database: `column geo does not exist` hoặc `relation Place does not exist`
*   **Triệu chứng**: Khi API backend truy vấn danh sách địa danh, terminal báo lỗi SQL liên quan đến trường `geo` hoặc bảng `Place`.
*   **Nguyên nhân gốc rễ**:
    1.  Cơ sở dữ liệu PostgreSQL local trong Docker chưa được kích hoạt tính năng không gian địa lý **PostGIS**.
    2.  Database chưa được đồng bộ cấu trúc schema của Prisma.
*   **Quy trình khắc phục**:
    1.  Đảm bảo container Docker đang chạy.
    2.  Chạy script db setup chuyên biệt của dự án để tự động kích hoạt PostGIS extension và thực hiện đồng bộ schema:
        ```bash
        pnpm --filter @vivu/api db:setup
        ```
    3.  Khởi chạy lại lệnh sinh client của Prisma:
        ```bash
        pnpm --filter @vivu/api prisma:generate
        ```

---

### C. Lỗi vỡ ảnh hoặc không hiển thị ảnh địa danh
*   **Triệu chứng**: Trang web tải bình thường nhưng toàn bộ ảnh địa danh bị vỡ (hiển thị biểu tượng ảnh lỗi) hoặc biến mất.
*   **Nguyên nhân gốc rễ**:
    1.  Backend không thể kết nối tới AWS S3 để ký ảnh do cấu hình sai key trong `apps/api/.env`.
    2.  Next.js Image Component chặn tải ảnh từ hostname lạ vì thiếu khai báo trong biến `NEXT_IMAGE_REMOTE_HOSTS` ở frontend.
*   **Quy trình khắc phục**:
    1.  Kiểm tra log của backend xem có lỗi `AccessDenied` hoặc `InvalidAccessKeyId` từ AWS SDK không.
    2.  Mở file `apps/web/.env.local` và kiểm tra xem biến `NEXT_IMAGE_REMOTE_HOSTS` đã chứa hostname S3 của bạn chưa.
    3.  *Giá trị chuẩn*:
        ```env
        NEXT_IMAGE_REMOTE_HOSTS=res.cloudinary.com,gia-lai-tourism-images.s3.ap-southeast-1.amazonaws.com,s3.ap-southeast-1.amazonaws.com
        ```
    4.  Khởi động lại frontend dev server để nhận cấu hình mới.

---

### D. Xung đột cổng kết nối (Port already in use)
*   **Triệu chứng**: Khi chạy lệnh `pnpm dev`, terminal báo lỗi `EADDRINUSE: address already in use :::3000` hoặc `:::4000`.
*   **Nguyên nhân gốc rễ**: Đang có một tiến trình Node.js hoặc phần mềm khác chạy ngầm chiếm dụng cổng 3000 (của Next.js) hoặc 4000 (của NestJS).
*   **Quy trình khắc phục**:
    *   **Trên Windows (PowerShell)**:
        Tìm và tắt tiến trình đang chiếm dụng cổng 4000:
        ```powershell
        Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
        ```
    *   **Trên macOS / Linux**:
        ```bash
        kill -9 $(lsof -t -i:4000)
        ```

---

## 2. Sự cố vận hành Production (Production Runtime Issues)

### A. Lỗi gửi form tư vấn hoặc báo lỗi báo "Invalid Captcha Token"
*   **Triệu chứng**: Người dùng thật điền form tư vấn chuyến đi nhưng khi nhấn nút gửi thì giao diện báo lỗi xác thực captcha thất bại.
*   **Nguyên nhân gốc rễ**:
    1.  Biến `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ở frontend và `TURNSTILE_SECRET_KEY` ở backend không khớp nhau.
    2.  Domain của bạn chưa được khai báo trong danh sách cho phép (Allowlist) của Cloudflare Turnstile dashboard.
*   **Quy trình khắc phục**:
    1.  Truy cập Cloudflare Dashboard, kiểm tra cấu hình của Site Key xem đã kích hoạt cho domain `vivu-web.vercel.app` chưa.
    2.  Kiểm tra và cập nhật lại chính xác các biến môi trường Turnstile trên dự án Vercel.
    3.  Nếu cần khôi phục dịch vụ gấp cho khách hàng trong lúc sửa khóa, đặt biến môi trường backend `TURNSTILE_ENABLED=false` và redeploy để tạm thời tắt xác thực captcha.

---

### B. Chatbot AI báo lỗi "Service Unavailable (503)"
*   **Triệu chứng**: Khách hàng mở khung chat AI gửi câu hỏi nhưng hệ thống lập tức hiển thị thông báo lỗi hệ thống bảo trì.
*   **Nguyên nhân gốc rễ**:
    1.  Cờ tính năng `AI_FEATURE_ENABLED` đang bị đặt thành `false` ở backend env.
    2.  Google Gemini API Key bị khóa hoặc vượt quá hạn mức thanh toán (Billing limits).
*   **Quy trình khắc phục**:
    1.  Kiểm tra xem biến `AI_FEATURE_ENABLED` trên Vercel có đang bị đặt thành `false` không.
    2.  Truy cập Google AI Studio, kiểm tra trạng thái hoạt động của API Key hiện tại. Thử chạy lệnh curl test trực tiếp từ máy cá nhân xem Gemini có trả lời không:
        ```bash
        curl -H "Content-Type: application/json" -d '{"contents":[{"parts":[{"text":"Xin chào"}]}]}' "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_GEMINI_KEY"
        ```
    3.  Nếu key bị khóa, hãy tạo một key mới, cập nhật vào biến `GEMINI_API_KEY` trên Vercel API và kích hoạt Redeploy.

# Cẩm nang Vận hành & Triển khai Hệ thống (Operations & Maintenance Manual)

Tài liệu này chứa các hướng dẫn chuyên sâu dành cho kỹ sư hệ thống (DevOps) để triển khai, giám sát, sao lưu dự phòng và ứng phó sự cố cho dự án Vivu trên môi trường production.

---

## 1. Hướng dẫn Triển khai Production (Production Deployment Playbook)

Môi trường production của Vivu được vận hành trên hạ tầng Serverless của **Vercel** để hỗ trợ tốc độ tải trang nhanh và khả năng co giãn lưu lượng. Khả năng chịu tải thực tế còn phụ thuộc vào PostgreSQL/Neon, Gemini, Qdrant, S3, quota provider và cấu hình rate limit/cache của ứng dụng.

### Quy trình các bước triển khai chi tiết:

#### Bước 1: Chuẩn bị và Kiểm tra an toàn trước khi đẩy code (Pre-flight Checklist)
Chạy các lệnh kiểm tra chất lượng tĩnh dưới local để đảm bảo bản build không bị lỗi runtime:
```bash
# 1. Đồng bộ và sinh các file schema database
pnpm --filter @vivu/api prisma:generate

# 2. Kiểm tra lỗi cú pháp và định dạng code
pnpm lint

# 3. Kiểm tra kiểu dữ liệu toàn bộ monorepo
pnpm typecheck

# 4. Chạy biên dịch thử
pnpm build
```

#### Bước 2: Di chuyển cấu trúc cơ sở dữ liệu (Database Migrations)
*   **Nguyên tắc**: Luôn chạy migration database **trước** khi triển khai mã nguồn mới của API để đảm bảo cấu trúc bảng mới đã sẵn sàng.
*   **Thực thi**:
    ```bash
    pnpm --filter @vivu/api prisma:migrate
    ```
    *   *Lưu ý*: Lệnh này sử dụng biến `DIRECT_DATABASE_URL` (không qua connection pooler) để tránh lỗi timeout do pooler giới hạn session.

#### Bước 3: Đẩy mã nguồn lên Vercel
*   Khi đẩy commit lên nhánh `main`, hệ thống CI/CD của Vercel sẽ tự động trigger bản build mới cho cả hai dự án Web và API.
*   Kiểm tra các biến môi trường trên Vercel dashboard đảm bảo đã khai báo đầy đủ (Xem chi tiết tại [docs/environment.md](environment.md)).

#### Bước 4: Kiểm tra phiên bản triển khai (Build Verification)
Sau khi Vercel báo trạng thái `Ready`, truy cập các endpoint metadata để đối chiếu mã hash commit:
*   Frontend: `https://vivu-web.vercel.app/build-info`
*   Backend API: `https://vivu-api.vercel.app/api/v1/build-info`
*   Đảm bảo trường `commitSha` trên cả hai trang trùng khớp với mã hash commit mới nhất trên git (`git rev-parse HEAD`).

---

## 2. Kịch bản Smoke Test trên Production (Production Smoke Testing)

Ngay sau khi hoàn tất deploy, kiểm tra thủ công các luồng nghiệp vụ chính để đảm bảo hệ thống không bị lỗi cấu hình CDN hoặc tích hợp dịch vụ:

*   **Kiểm tra SEO & Định tuyến**:
    *   Truy cập `https://vivu-web.vercel.app/robots.txt` và `sitemap.xml`. Đảm bảo file sitemap trả về danh sách các link địa danh thực tế và robots.txt đã chặn đúng các thư mục riêng tư như `/admin`, `/tai-khoan`.
*   **Kiểm tra Tải ảnh (CDN Image Load)**:
    *   Truy cập trang khám phá và một vài trang địa điểm cụ thể (Ví dụ: `/dia-diem/bien-ho`).
    *   Đảm bảo hình ảnh được hiển thị sắc nét, không bị lỗi vỡ hình (Broken image) - nguyên nhân chính thường do thiếu hostname của S3 trong biến `NEXT_IMAGE_REMOTE_HOSTS` của Next.js.
*   **Kiểm tra Luồng Nghiệp vụ (Trip Planner & Lead Capture)**:
    1.  Mở trang `/lich-trinh`, thực hiện tạo một lịch trình mẫu.
    2.  Sau khi hiển thị lịch trình, nhấn nút "Gửi yêu cầu tư vấn".
    3.  Hệ thống chuyển hướng sang trang `/tu-van` và tự động điền các thông tin lịch trình vào ô ghi chú.
    4.  Nhập tên, số điện thoại và nhấn gửi.
    5.  Đăng nhập tài khoản admin, truy cập `/admin/leads` để xác nhận yêu cầu tư vấn vừa gửi đã hiển thị chính xác trong danh sách quản trị.

---

## 3. Sao lưu và Khôi phục (Backup & Disaster Recovery)

### A. Sao lưu cơ sở dữ liệu PostgreSQL
*   Kiểm tra retention/backup policy theo plan Neon đang dùng. Trước migration lớn, nên tạo snapshot/backup thủ công hoặc dùng `pg_dump` với `DIRECT_DATABASE_URL`.
*   **Sao lưu thủ công**: Khi cần cập nhật dữ liệu lớn hoặc nâng cấp hệ thống, thực hiện sao lưu thủ công bằng công cụ `pg_dump`:
    ```bash
    pg_dump -d "DIRECT_DATABASE_URL_HERE" -F c -b -v -f backup_vivu_$(date +%Y%m%d).dump
    ```

### B. Khôi phục dữ liệu (Restore)
*   Để khôi phục dữ liệu từ tệp dump vào database trống:
    ```bash
    pg_restore -d "DIRECT_DATABASE_URL_HERE" -v backup_vivu_xxxx.dump
    ```

Qdrant có thể được rebuild từ dữ liệu gốc nếu pipeline embedding/reindex tương ứng đang được cấu hình. Kiểm tra script hiện có trước khi chạy.

---

## 4. Giám sát hệ thống & Thiết lập cảnh báo (Monitoring & Alerting)

### A. Giám sát tính sẵn sàng (Uptime)
*   Sử dụng công cụ UptimeRobot hoặc Better Uptime để giám sát định kỳ 5 phút/lần các endpoint:
    *   Trang chủ: `https://vivu-web.vercel.app`
    *   API Health: `https://vivu-api.vercel.app/api/v1/readyz`

### B. Cảnh báo lỗi Runtime (Error Tracking)
*   Cấu hình Sentry cho cả ứng dụng Web và API bằng cách khai báo biến `SENTRY_DSN`.
*   Thiết lập cảnh báo về Telegram/Slack của đội kỹ thuật khi phát hiện:
    *   Tỷ lệ lỗi 5xx trên backend vượt quá 1% trong vòng 5 phút.
    *   Xuất hiện lỗi `PrismaClientKnownRequestError` liên quan đến kết nối database.

---

## 5. Quy trình ứng phó sự cố khẩn cấp (Emergency Runbook)

Khi phát hiện hệ thống bị tấn công spam hoặc chi phí dịch vụ AI (Gemini/Qdrant) tăng đột biến:

1.  **Nhận diện sự cố**: Chi phí sử dụng API Google Cloud tăng vọt, hoặc log API báo nhiều request liên tục từ các dải IP lạ vào endpoint `/ai/chat` hoặc `/trip-plans/generate`.
2.  **Kích hoạt công tắc khẩn cấp**:
    *   Truy cập Vercel Project Settings của dự án API.
    *   Chuyển biến `AI_FEATURE_ENABLED` thành `false` và `TRIP_PLANNER_FEATURE_ENABLED` thành `false`.
    *   Nhấn **Redeploy** bản build hiện tại để cập nhật cấu hình ngay lập tức.
3.  **Hành vi hệ thống sau khi tắt**:
    *   Chatbot AI sẽ trả về thông báo bảo trì.
    *   Luồng tạo lịch trình AI sẽ tự động ẩn và hướng dẫn người dùng sang form gửi yêu cầu tư vấn thủ công `/tu-van`.
4.  **Điều tra sự cố**:
    *   Quét nhật ký log trên Vercel để tìm các IP gửi request bất thường.
    *   Chặn các IP này tại tầng Cloudflare Firewall hoặc Vercel Firewall.
    *   Sau khi kiểm soát được tình hình, bật lại các cờ tính năng về `true`.
    *   **Lưu ý quan trọng**:
        *   Redeploy API sau khi đổi cấu hình biến môi trường để cập nhật trạng thái runtime mới ngay lập tức.
        *   Kiểm tra lại hạn mức sử dụng và chi phí (billing/quota) sau khi xử lý xong sự cố.
        *   Tuyệt đối không ghi nhận hoặc commit bất kỳ mã khóa bảo mật nào (secrets/API keys) vào log hay repository trong quá trình xử lý sự cố.


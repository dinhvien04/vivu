# Kiến thức & Chính sách Bảo mật Hệ thống (Security Infrastructure)

Tài liệu này đặc tả các tiêu chuẩn bảo mật, cơ chế mã hóa, phân quyền người dùng và quy trình xử lý sự cố an ninh thông tin được triển khai trong hệ thống Vivu.

---

## 1. Cơ chế Xác thực & Quản lý Phiên làm việc (Authentication & Session Security)

Hệ thống Vivu sử dụng mô hình xác thực kép kết hợp JSON Web Token (JWT) và Cookie bảo mật nhằm cân bằng giữa trải nghiệm người dùng và an toàn thông tin:

```
[ Client Browser ]                      [ Next.js Proxy ]                      [ NestJS API ]
        │                                       │                                     │
        │─── Đăng nhập (Mật khẩu) ─────────────>│                                     │
        │                                       │─── POST /api/v1/auth/login ────────>│
        │                                       │                                     │
        │                                       │<── Trả Access & Refresh Tokens ─────│
        │                                       │    (Refresh Token: HTTP-Only)       │
        │<── Thiết lập Session Cookie ──────────│                                     │
        │    HttpOnly, Secure, SameSite=Lax     │                                     │
```

*   **Access Token**:
    *   Mã JWT chứa thông tin định danh và vai trò (Role) của người dùng.
    *   Có thời hạn sống ngắn (mặc định `15m` - 15 phút) nhằm giảm thiểu thiệt hại nếu token bị lộ.
    *   Được lưu trữ trong bộ nhớ tạm (Memory) của client, không ghi vào `localStorage` để chống tấn công XSS trích xuất token.
*   **Refresh Token**:
    *   Dùng để cấp lại Access Token mới khi hết hạn mà người dùng không cần đăng nhập lại.
    *   Có thời hạn sống dài hơn (mặc định `7d` - 7 ngày).
    *   **Bảo mật lưu trữ**: Được Next.js ghi vào Cookie của trình duyệt với các cờ bắt buộc:
        *   `HttpOnly`: Ngăn chặn JavaScript phía client truy cập vào cookie (chống XSS).
        *   `Secure`: Chỉ gửi cookie qua kết nối HTTPS đã mã hóa.
        *   `SameSite=Lax`: Chống tấn công CSRF (Cross-Site Request Forgery) bằng cách giới hạn gửi cookie trong các truy vấn chéo trang.
        *   `Path=/api/v1/auth`: Chỉ gửi cookie lên các endpoint xác thực, tránh lộ token ở các request tĩnh khác.
    *   **Database Hashing**: Ở database, trường refresh token được băm một chiều (bcrypt/sha256). Khi người dùng thực hiện refresh, API băm token gửi lên và đối chiếu với hash trong DB.

---

## 2. Bảo vệ Biểu mẫu & Phòng chống Lạm dụng (Form Security & Anti-Abuse)

### A. Tích hợp Cloudflare Turnstile
*   Các form public đã/đang áp dụng Turnstile tùy cấu hình, tối thiểu gồm Tư vấn (`/tu-van`) và Báo lỗi dữ liệu. Nếu bật đăng ký public, register cũng nên dùng Turnstile và rate limit.
*   **Quy trình xác thực**:
    1.  Người dùng hoàn thành captcha trên trình duyệt, Turnstile sinh ra một token.
    2.  Token được gửi lên backend kèm theo dữ liệu form.
    3.  Backend gọi API xác thực của Cloudflare để kiểm tra tính hợp lệ của token. Nếu không hợp lệ hoặc thiếu token, request lập tức bị từ chối với mã lỗi `400 Bad Request`.

### B. Honeypot Spambot Guard
*   Trong form gửi yêu cầu tư vấn, hệ thống chèn một trường input ẩn đối với người dùng thông thường bằng CSS (Ví dụ: `<input type="text" name="website" style="display:none" />`).
*   **Hoạt động**: Người dùng thật khi điền form sẽ không nhìn thấy trường này và để trống. Tuy nhiên, các bot tự động (spam bots) khi quét mã HTML sẽ tự động điền thông tin vào tất cả các ô input.
*   **Xử lý ở backend**: Nếu request gửi lên chứa giá trị trong trường `website`, backend lập tức đánh dấu đây là spam, từ chối lưu vào cơ sở dữ liệu để tránh làm rác database.

---

## 3. Cấu hình Headers Bảo mật & CSP (Security Headers & Content Security Policy)

Ứng dụng cấu hình các header an ninh nghiêm ngặt thông qua file `next.config.mjs`:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; connect-src 'self' https://vivu-api.vercel.app https://challenges.cloudflare.com; img-src 'self' data: https://res.cloudinary.com https://*.amazonaws.com; frame-src https://challenges.cloudflare.com;"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

*   **Content-Security-Policy (CSP)**: Giới hạn các domain mà trình duyệt được phép tải tài nguyên (scripts, images, stylesheets). Việc này giúp giảm rủi ro XSS/code injection từ server lạ vào trang web.
    *   *Lưu ý*: `'unsafe-inline'` chỉ nên được xem là cấu hình tương thích tạm thời cho Next.js/third-party widget nếu chưa triển khai nonce/hash. Khi có thời gian, ưu tiên chuyển sang CSP nonce/hash để giảm rủi ro XSS.
*   **X-Frame-Options: DENY**: Ngăn chặn trang web bị nhúng vào thẻ `<iframe>` của các trang web giả mạo khác, loại bỏ nguy cơ tấn công Clickjacking.

---

## 4. Quy trình Đảo khóa Bảo mật (Secrets Rotation Playbook)

Định kỳ hoặc khi phát hiện dấu hiệu rò rỉ khóa bảo mật, quản trị viên hệ thống thực hiện quy trình đổi khóa sau:

1.  **Bước 1: Tạo khóa mới**:
    *   Tạo chuỗi ngẫu nhiên mới cho JWT secrets.
    *   Sinh cặp Access Key / Secret Key mới trên AWS Console.
2.  **Bước 2: Cấu hình song song (Môi trường chuyển đổi)**:
    *   Cập nhật các khóa mới vào biến môi trường của dự án API trên Vercel.
    *   *Lưu ý*: Không xóa các khóa cũ ngay lập tức để tránh làm hỏng các phiên làm việc hiện tại của người dùng.
3.  **Bước 3: Redeploy & Kiểm tra**:
    *   Kích hoạt redeploy dự án API.
    *   Thực hiện upload thử ảnh, đăng nhập thử để đảm bảo hệ thống nhận key mới thành công.
4.  **Bước 4: Thu hồi khóa cũ**:
    *   Tiến hành vô hiệu hóa (Deactivate) và xóa bỏ các key cũ trên AWS Console và thu hồi JWT secret cũ. Thời gian chuyển đổi phụ thuộc vào token TTL/session policy; nếu secret bị lộ nghiêm trọng, ưu tiên revoke ngay và force logout.
---

## 5. Clerk Authentication Migration Policy

Clerk is the session and identity provider for new sign-in/sign-up flows. The
NestJS API still authorizes every protected request from the Neon/Postgres
`User` row:

* A valid Clerk session token proves identity only.
* The API maps Clerk `sub` to `User.clerkUserId`, then reads `User.role`.
* New Clerk users are created with DB role `user`.
* Existing `admin` and `editor` users keep their DB role when linked by exact
  email match or `clerkUserId`.
* Frontend role, Clerk metadata, and Clerk Organizations are not trusted for
  Vivu authorization.
* Legacy JWT/password auth remains available during migration for rollback.
* Clerk webhook `user.deleted` soft-disables the DB user via `User.deletedAt`
  instead of hard deleting business data.

Admin/editor promotion remains a trusted DB operation, e.g. the existing
`pnpm --filter @vivu/api promote:admin` script or a reviewed admin tool.

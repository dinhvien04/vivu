# Vivu Console Abuse & Self-XSS Guide

Cập nhật: 24/06/2026.

## Điều quan trọng

Code chạy trong DevTools/Console chỉ chạy trong trình duyệt của người dùng. Nó không thể tự sửa
server hoặc vượt qua backend guard nếu server kiểm tra đúng. Rủi ro thật là:

- Script gọi spam API public như AI Chat, Trip Planner, Lead, Data Report hoặc Search.
- Script đánh cắp access token đang nằm trong memory nếu admin tự dán code lạ vào Console.
- Self-XSS: kẻ xấu dụ admin dán đoạn code vào Console khi đang đăng nhập.
- Đốt quota Gemini/Qdrant nếu public endpoint không có quota/rate limit.

Vì vậy Vivu không cố “chặn mở DevTools”. Lớp phòng thủ đúng nằm ở backend: rate limit, daily quota,
honeypot, Turnstile optional, role guard, CSP và log không chứa dữ liệu nhạy cảm.

## Lớp bảo vệ đã có

- Global API throttle theo IP qua Nest Throttler.
- Endpoint throttle:
  - `POST /api/v1/ai/chat`
  - `POST /api/v1/trip-plans/generate`
  - `POST /api/v1/leads`
  - `POST /api/v1/data-reports`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register`
  - `GET /api/v1/search/suggest`
- Daily quota:
  - AI anonymous/user.
  - Trip Planner anonymous/user.
- HMAC hash cho abuse keys bằng `ABUSE_HASH_SECRET`; không lưu raw IP nếu không cần.
- Honeypot `website` cho lead và data report.
- Turnstile optional cho lead và data report.
- Admin API dùng `JwtAuthGuard + RolesGuard`.
- Refresh token nằm trong HttpOnly cookie của Next proxy; access token giữ trong React memory.
- CSP production không dùng `unsafe-eval`, có `frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`.
- JSON-LD dùng serializer an toàn để không đóng được thẻ `<script>`.

## Env cần set

Backend:

```env
GLOBAL_RATE_LIMIT_PER_MINUTE=120
ABUSE_HASH_SECRET=
AI_CHAT_RATE_LIMIT_PER_MINUTE=10
AI_DAILY_QUOTA_ANON=20
AI_DAILY_QUOTA_USER=100
TRIP_PLANNER_RATE_LIMIT_PER_MINUTE=5
TRIP_PLANNER_DAILY_QUOTA_ANON=5
TRIP_PLANNER_DAILY_QUOTA_USER=20
LEADS_RATE_LIMIT_PER_HOUR=20
DATA_REPORT_RATE_LIMIT_PER_HOUR=10
AUTH_RATE_LIMIT_PER_15_MIN=20
SEARCH_RATE_LIMIT_PER_MINUTE=60
TURNSTILE_ENABLED=false
TURNSTILE_SECRET_KEY=
```

Frontend:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

`ABUSE_HASH_SECRET` nên là chuỗi random mạnh, tách biệt với JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Khi bật Turnstile

1. Tạo site trong Cloudflare Turnstile.
2. Set backend `TURNSTILE_ENABLED=true`.
3. Set backend `TURNSTILE_SECRET_KEY`.
4. Set web `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
5. Redeploy cả API và Web.
6. Test `/tu-van` và modal `Báo lỗi thông tin`.

Nếu chưa set site key frontend, widget không render. Nếu backend bật mà frontend không gửi token,
backend sẽ từ chối lead/report bằng 400.

## Checklist khi nghi bị abuse

- [ ] Kiểm tra spike 429 trên API logs.
- [ ] Kiểm tra usage AI và Trip Planner theo ngày.
- [ ] Tạm giảm `AI_CHAT_RATE_LIMIT_PER_MINUTE` và `TRIP_PLANNER_RATE_LIMIT_PER_MINUTE`.
- [ ] Bật `TURNSTILE_ENABLED=true` cho lead/report nếu form spam tăng.
- [ ] Kiểm tra `/admin/leads` có lead spam bất thường.
- [ ] Kiểm tra `/admin/bao-loi` có data report spam bất thường.
- [ ] Không log full prompt, phone/email/note/token/cookie khi điều tra.

## Checklist khi nghi admin bị Self-XSS

- [ ] Admin phải logout ngay.
- [ ] Đổi mật khẩu admin.
- [ ] Revoke refresh tokens của admin nếu cần.
- [ ] Kiểm tra audit logs admin.
- [ ] Kiểm tra lead/report/admin actions trong khoảng thời gian nghi vấn.
- [ ] Rotate secrets nếu nghi token/secret đã bị lộ.
- [ ] Nhắc admin không bao giờ dán code lạ vào Console khi đang đăng nhập.

## CSRF ghi chú

Vivu dùng access token trong Authorization header cho API protected routes, nên CSRF risk thấp hơn
cookie-auth trực tiếp vì site lạ không tự gắn được Authorization header. Refresh token nằm trong
HttpOnly cookie path `/api/auth` của Next proxy, `SameSite=Lax`, `Secure` ở production. Nếu sau này
chuyển toàn bộ auth sang cookie trực tiếp cho API, cần thêm Origin/Referer check hoặc CSRF token cho
mọi POST/PUT/PATCH/DELETE.

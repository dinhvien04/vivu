# Cloudflare Turnstile Setup

Vivu dùng Cloudflare Turnstile ở các form có rủi ro spam nhưng không bật bừa bãi lên các luồng AI để tránh làm xấu UX.

## Route Đang Dùng Turnstile

- `/tu-van`: form gửi yêu cầu tư vấn chuyến đi.
- Form `Báo lỗi thông tin` trên trang chi tiết địa danh.
- `/dang-ky`: form đăng ký tài khoản.
- `/quen-mat-khau`: form gửi email đặt lại mật khẩu.

Backend verify token khi `TURNSTILE_ENABLED=true`. Nếu token thiếu, sai hoặc hết hạn, API trả lỗi tiếng Việt thân thiện để người dùng xác minh lại.

## Route Cố Tình Không Bật Mặc Định

- AI Chat.
- Trip Planner generate.
- Search, Explore, Map.
- Login thông thường.

Các route này đang được bảo vệ bằng rate limit, quota, timeout và lockout mềm. Login không nên bắt captcha mọi lần; TODO hợp lý là thêm adaptive Turnstile sau nhiều lần đăng nhập sai trong 15 phút.

## Env

Backend API:

```env
TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=...
```

Frontend web:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

`TURNSTILE_SECRET_KEY` chỉ được đặt ở backend. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` là public site key cho frontend.

Sau khi đổi `TURNSTILE_SECRET_KEY`, redeploy API. Sau khi đổi `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, redeploy web.

Trong Cloudflare Turnstile, thêm hostname:

- `vivu-web.vercel.app`
- domain production chính nếu có custom domain
- `localhost` nếu cần test local

## Test Production

1. Mở `/tu-van`, thấy Turnstile, gửi form sau khi xác minh.
2. Mở một trang địa danh, bấm `Báo lỗi thông tin`, thấy Turnstile và gửi được report.
3. Mở `/dang-ky`, thấy Turnstile và đăng ký được sau khi xác minh.
4. Mở `/quen-mat-khau`, thấy Turnstile và gửi yêu cầu reset được sau khi xác minh.
5. AI Chat và Trip Planner vẫn không bắt Turnstile mặc định.

# Vivu Monitoring Checklist

Cập nhật: 24/06/2026.

## Uptime

- [ ] Monitor `https://vivu-web.vercel.app/`.
- [ ] Monitor `https://vivu-api.vercel.app/api/v1/health` nếu endpoint health sẵn sàng.
- [ ] Alert khi web/API 5xx liên tục trong 5 phút.
- [ ] Alert khi latency API tăng bất thường.

## Frontend

- [ ] Theo dõi lỗi render/hydration của Next.js.
- [ ] Theo dõi lỗi submit lead/report.
- [ ] Theo dõi lỗi Trip Planner generate.
- [ ] Theo dõi lỗi AI Chat upload ảnh/gửi message.
- [ ] Không gửi phone/email/token/full note vào error tracking.
- [ ] Nếu thêm Sentry sau này: kiểm tra source maps production và scrub PII.

## Backend

- [ ] Alert API 500.
- [ ] Alert auth login failure spike.
- [ ] Alert rate limit/429 spike.
- [ ] Alert Gemini timeout/failure spike.
- [ ] Alert Qdrant timeout/failure spike.
- [ ] Alert S3 presigned/image failure spike.
- [ ] Log có request id/correlation id nếu có thể.
- [ ] Không log raw token, password, phone, email, nội dung lead/report đầy đủ.

## Product Signals

- [ ] `lead_submitted`/`lead_form_submitted` giảm bất thường.
- [ ] `trip_plan_failed` tăng bất thường.
- [ ] `ai_missing_context` tăng bất thường.
- [ ] `trip_plan_missing_data` tăng bất thường.
- [ ] `ai_feedback_submitted` với value `wrong`/`missing_info` tăng bất thường.
- [ ] Search no result hoặc query lặp lại nhiều lần.

## Admin Dashboard Smoke Test

- [ ] Card lead mới hiển thị.
- [ ] Card lead đang tư vấn hiển thị.
- [ ] Card báo lỗi dữ liệu mới hiển thị.
- [ ] Card AI cần xem lại hiển thị.
- [ ] Empty state không crash khi chưa có dữ liệu.

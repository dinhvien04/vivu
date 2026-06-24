# Vivu Cost Guardrails

Cập nhật: 24/06/2026.

Tài liệu này dùng để giữ chi phí production trong tầm kiểm soát cho AI, Qdrant, S3, Vercel và database. Không lưu secret trong repo.

## Endpoint Public Cần Bảo Vệ

- AI Chat: giới hạn độ dài message, giới hạn kích thước ảnh, quota theo user/IP/session, timeout Gemini/Qdrant.
- Trip Planner: giới hạn số ngày, độ dài note, quota riêng cho anonymous/user, timeout Gemini.
- Lead form: giới hạn độ dài field, Turnstile, rate limit, honeypot.
- Data report: giới hạn message/contact, Turnstile, rate limit, honeypot.
- Search: giới hạn độ dài query, pagination limit.
- Auth login/register/forgot password: rate limit, lockout, Turnstile ở register/forgot password.
- Admin lists: pagination limit, role guard backend.

## Env Chính

- `AI_ANON_DAILY_LIMIT`, `AI_USER_DAILY_LIMIT`: quota AI chat.
- `AI_ANON_IMAGE_DAILY_LIMIT`, `AI_USER_IMAGE_DAILY_LIMIT`: quota upload ảnh AI.
- `TRIP_PLANNER_ANON_DAILY_LIMIT`, `TRIP_PLANNER_USER_DAILY_LIMIT`: quota Trip Planner.
- `AI_MAX_MESSAGE_LENGTH`, `AI_MAX_IMAGE_SIZE_BYTES`: giới hạn input AI.
- `GEMINI_TIMEOUT_MS`, `GEMINI_MAX_OUTPUT_TOKENS`: giới hạn Gemini.
- `QDRANT_TIMEOUT_MS`: giới hạn Qdrant.
- `S3_PRESIGNED_EXPIRES_IN`, `S3_PRESIGNED_CACHE_MAX_ENTRIES`: giới hạn presigned URL/cache.
- `LEAD_RATE_LIMIT_PER_MINUTE`, `DATA_REPORT_RATE_LIMIT_PER_MINUTE`: bảo vệ form public.
- `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`: bật/tắt chống spam.

## Billing Alert Cần Set

- Vercel: bandwidth, function execution, error spike.
- Gemini/Google AI Studio: request/token spend, daily cap nếu có.
- Qdrant Cloud: query volume, storage, cluster CPU/RAM.
- AWS S3: storage, GET request, egress, presigned URL abuse.
- Neon/Postgres: storage, compute hours, connection count.

## Tạm Tắt AI Khi Bị Abuse

1. Giảm quota env AI/Trip Planner xuống mức rất thấp.
2. Tăng Turnstile/rate limit ở form public nếu đang bị spam lead/report.
3. Tạm ẩn CTA AI trên frontend nếu cần, nhưng backend vẫn phải enforce quota.
4. Rotate `GEMINI_API_KEY` hoặc `QDRANT_API_KEY` nếu nghi ngờ lộ key.
5. Kiểm tra analytics event `ai_missing_context`, `ai_feedback_submitted`, `trip_plan_failed`.

## Nguyên Tắc

- Frontend không gọi trực tiếp Gemini, Qdrant, S3 private.
- Không trả stack trace production.
- Không log phone/email/token/note dài.
- Pagination public/admin phải có `pageSize` tối đa.
- Thêm endpoint public mới thì phải thêm quota/rate-limit hoặc lý do rõ trong PR.

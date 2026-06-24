# Vivu Backup And Restore

Cập nhật: 24/06/2026.

## PostgreSQL / Neon

- Dữ liệu chính nằm trong PostgreSQL qua Prisma.
- Cần bật backup/PITR theo gói Neon đang dùng.
- Tối thiểu kiểm tra snapshot hằng ngày trước public beta.
- Restore thử trên database staging trước khi đụng production.

Quy trình restore khẩn cấp:

1. Tạm dừng deploy/cron/script ghi dữ liệu nếu đang lỗi lan rộng.
2. Tạo database branch/restore point từ Neon.
3. Chạy `pnpm --filter @vivu/api prisma:generate`.
4. Chạy smoke test API: `/api/v1/places`, `/api/v1/places/:slug`, auth/admin.
5. Trỏ `DATABASE_URL` production sang DB đã restore nếu đã xác nhận.

## S3

- Bucket hiện dùng: `gia-lai-tourism-images`.
- Ảnh/docs gốc nên bật versioning nếu ngân sách cho phép.
- Không public secret AWS.
- Nếu cần backup ngoài AWS: dùng `aws s3 sync s3://gia-lai-tourism-images <backup-target>` từ máy tin cậy.

## Qdrant

- Collections đang dùng:
  - `text_collection_cloud`
  - `image_collection_cloud`
- Qdrant chỉ dùng cho AI retrieval, không phải database hiển thị chính.
- Nếu mất collection, rebuild embedding từ dữ liệu S3/text bằng pipeline riêng. Không tạo collection lại từ frontend.
- Cần lưu lại model/config đang dùng:
  - Text: `intfloat/multilingual-e5-small`, query prefix `query: ...`
  - Image: `qdrant/clip-vit-b-32-vision`
  - Text-to-image: `qdrant/clip-vit-b-32-text`

## Env And Secrets

- Không commit `.env` thật.
- Inventory secret nên nằm trong Vercel/AWS/Google/Qdrant console và password manager.
- Rotate ngay khi nghi ngờ lộ:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `GEMINI_API_KEY`
  - `QDRANT_API_KEY`
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
  - `TURNSTILE_SECRET_KEY`

## Disaster Recovery Checklist

- DB mất: restore Neon snapshot/branch, kiểm tra Prisma schema/migration.
- S3 mất ảnh: restore từ versioning/backup sync, kiểm tra hero/gallery top places.
- Qdrant mất collection: tạm giữ web hoạt động từ DB, rebuild RAG sau.
- Gemini key bị lộ: rotate key, giảm quota AI, redeploy API.
- Admin account bị lộ: reset password, revoke refresh token, đổi role nếu cần, kiểm tra audit log.

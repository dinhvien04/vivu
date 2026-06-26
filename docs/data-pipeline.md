# Data Pipeline

Tài liệu này mô tả luồng dữ liệu chính của Vivu cho địa danh, ảnh, tìm kiếm và AI/RAG.

## Scope Dữ Liệu

Vivu hiện tập trung vào Gia Lai mới, bao gồm Gia Lai và Bình Định cũ theo scope dữ liệu Vivu.

## Source Hiển Thị Chính

PostgreSQL/PostGIS là nguồn dữ liệu chính cho web hiển thị:

- địa danh,
- mô tả,
- tỉnh/khu vực/category,
- tọa độ,
- ảnh đại diện,
- review,
- lead và data report.

Qdrant không phải database hiển thị chính.

## Ảnh Và Tài Liệu

- AWS S3 lưu ảnh/tài liệu gốc.
- Bucket private nên backend tạo presigned URL trước khi trả frontend.
- Frontend không gọi S3 trực tiếp.
- Next Image chỉ load remote image từ hostname được allowlist qua `NEXT_IMAGE_REMOTE_HOSTS`.

## Search

- Meilisearch là search engine chính.
- PostgreSQL là fallback khi Meilisearch chưa sẵn sàng hoặc ở luồng đã hỗ trợ fallback.

Reindex:

```bash
pnpm --filter @vivu/api reindex:meili
```

## AI/RAG

- Qdrant Cloud dùng để retrieval context cho AI Chat.
- Gemini sinh câu trả lời AI và lịch trình.
- Backend chỉ query Qdrant Cloud Inference, không chạy embedding local.
- Không import BGE-M3, SigLIP, Transformers, Torch hoặc FlagEmbedding trong backend.
- Không tạo lại collection Qdrant nếu không có kế hoạch migration rõ ràng.

## Sync Commands

Đồng bộ địa danh và ảnh từ S3 vào database:

```bash
pnpm --filter @vivu/api sync:locations
```

Đồng bộ tọa độ:

```bash
pnpm --filter @vivu/api sync:coordinates
```

Reindex search:

```bash
pnpm --filter @vivu/api reindex:meili
```

## Không Làm

- Không hard-code danh sách địa danh trong frontend.
- Không gọi S3/Qdrant/Gemini trực tiếp từ frontend.
- Không dùng Qdrant làm source hiển thị chính.
- Không commit presigned URL hoặc API key.

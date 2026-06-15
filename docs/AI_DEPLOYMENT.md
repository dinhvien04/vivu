# Triển khai AI Chat

## Kiến trúc

```text
Web -> POST /api/v1/ai/chat -> NestJS
                                |-> Qdrant Cloud Inference
                                |-> Gemini
                                `-> S3 presigned URL
```

Frontend không gọi trực tiếp Qdrant, Gemini hoặc AWS.

## Biến môi trường backend

```env
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_TEXT_COLLECTION=text_collection_cloud
QDRANT_IMAGE_COLLECTION=image_collection_cloud
QDRANT_TEXT_MODEL=intfloat/multilingual-e5-small
QDRANT_IMAGE_MODEL=qdrant/clip-vit-b-32-vision
QDRANT_IMAGE_TEXT_MODEL=qdrant/clip-vit-b-32-text
TOP_K_TEXT=5
TOP_K_IMAGES=5
IMAGE_MATCH_THRESHOLD=0.25

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=gia-lai-tourism-images
S3_PRESIGNED_EXPIRES_IN=3600
S3_PRESIGNED_CACHE_MAX_ENTRIES=2000
REFERENCE_DATA_CACHE_TTL_MS=300000
```

Không đặt các biến bí mật trên Vercel project của frontend.

## Biến môi trường frontend

```env
NEXT_PUBLIC_API_URL=https://vivu-api.vercel.app
API_INTERNAL_URL=https://vivu-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://vivu-web.vercel.app
```

## Qdrant

Ứng dụng sử dụng collection có sẵn:

- Text: `text_collection_cloud`
- Image: `image_collection_cloud`

Text query được gửi với prefix `query: `. Qdrant Cloud Inference tạo vector từ
text hoặc ảnh; backend không tải model embedding local và không tạo lại
collection.

## Gemini

Prompt backend bắt buộc model:

- trả lời bằng tiếng Việt;
- chỉ dùng context truy xuất được;
- nói không đủ dữ liệu nếu context thiếu;
- không bịa giá vé, giờ mở cửa hoặc địa chỉ.

Model được chọn qua `GEMINI_MODEL`, do đó có thể đổi model mà không sửa code.

## Request

```text
POST /api/v1/ai/chat
Content-Type: multipart/form-data
```

Fields:

- `message`: tùy chọn
- `session_id`: tùy chọn
- `image`: tùy chọn

Phải có ít nhất `message` hoặc `image`.

Frontend nhận ảnh gốc tối đa 4 MB và cố gắng nén xuống khoảng 700 KB trước khi
upload. Backend vẫn phải kiểm tra MIME type và kích thước request.

## Kiểm tra ba chế độ

Health checks:

```text
GET /api/v1/healthz
GET /api/v1/ai/health
GET /api/v1/ai/health/qdrant
GET /api/v1/ai/health/gemini
```

Text-only:

```bash
curl -X POST https://vivu-api.vercel.app/api/v1/ai/chat \
  -F "message=Biển Hồ Gia Lai có gì đẹp?" \
  -F "session_id=smoke-text"
```

Image-only:

```bash
curl -X POST https://vivu-api.vercel.app/api/v1/ai/chat \
  -F "image=@./sample.jpg" \
  -F "session_id=smoke-image"
```

Image + text:

```bash
curl -X POST https://vivu-api.vercel.app/api/v1/ai/chat \
  -F "message=Chỗ này có gì chơi?" \
  -F "image=@./sample.jpg" \
  -F "session_id=smoke-image-text"
```

## Checklist deploy

1. Cấu hình env backend.
2. Deploy API và kiểm tra health Qdrant/Gemini.
3. Test ba input mode trực tiếp với API.
4. Cấu hình URL API cho frontend.
5. Deploy web.
6. Test upload ảnh trên mobile và desktop.
7. Kiểm tra log không chứa API key hoặc nội dung `.env`.

## Xử lý sự cố

| Hiện tượng                  | Kiểm tra                                             |
| --------------------------- | ---------------------------------------------------- |
| Không tìm thấy text context | Collection/model, prefix `query: `, payload          |
| Image match thấp            | Model vision, định dạng ảnh, threshold               |
| Image + text trả sai nơi    | `place_slug` trong image payload và text filter      |
| Gemini từ chối/trống        | API key, model, quota, context                       |
| Ảnh kết quả không mở        | S3 key, region, quyền bucket, thời hạn presigned URL |
| Trình duyệt báo CORS        | `CORS_ORIGINS` ở backend hoặc same-origin proxy      |

## Ràng buộc

- Không import BGE-M3, SigLIP, Transformers, Torch hoặc FlagEmbedding.
- Không tạo/xóa collection Qdrant trong luồng deploy.
- Không đưa API key vào bundle frontend.
- Không sửa logo hoặc brand Vivu.

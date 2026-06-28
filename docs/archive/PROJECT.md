# Phạm vi dự án Vivu

## Sản phẩm

Vivu là nền tảng tra cứu du lịch Gia Lai, tập trung vào:

- khám phá địa danh từ dữ liệu backend;
- xem ảnh và thông tin ngắn gọn;
- tìm kiếm và bản đồ;
- yêu thích, sổ tay, đánh giá và hỏi đáp;
- AI Chat nhận văn bản hoặc ảnh địa danh.

Logo và brand name luôn là **Vivu**.

## Nguồn dữ liệu

| Nguồn              | Vai trò                           |
| ------------------ | --------------------------------- |
| PostgreSQL/PostGIS | Nguồn chính cho web và nghiệp vụ  |
| AWS S3             | File ảnh địa danh                 |
| Meilisearch        | Chỉ mục tìm kiếm                  |
| Qdrant Cloud       | Context cho AI search             |
| Gemini             | Sinh câu trả lời dựa trên context |

Frontend không hard-code danh sách địa danh và không gọi trực tiếp AWS,
Qdrant hoặc Gemini.

## Quy ước địa danh

- `locationKey`: khóa từ folder dữ liệu, ví dụ `BIEN_HO`.
- `slug`: khóa URL ổn định, ví dụ `bien-ho`.
- `name`: tên tiếng Việt có dấu đã được chuẩn hóa.
- `province`: phạm vi công khai là `Gia Lai`.
- `description`: phần giới thiệu ngắn, không đưa nguyên tài liệu RAG dài lên UI.
- `heroImageS3Key`: key ảnh, không phải khóa bí mật hay URL cố định.
- `qdrantPlaceSlug`: khóa liên kết context AI.

Địa danh thiếu ảnh hợp lệ có thể được bỏ khỏi khu vực phụ thuộc hình ảnh để
không hiển thị placeholder lỗi.

## Quy tắc AI

- Không chạy BGE-M3, SigLIP, Transformers, Torch hoặc FlagEmbedding local.
- Không tạo lại collection Qdrant từ ứng dụng.
- Dùng Qdrant Cloud Inference cho truy vấn text và image.
- Chỉ Gemini backend được phép đọc `GEMINI_API_KEY`.
- Câu trả lời phải bám context và thừa nhận khi dữ liệu chưa đủ.

## Ngoài phạm vi

- Đặt phòng, bán tour hoặc thanh toán.
- Frontend tự đọc S3 bucket.
- Dùng Qdrant làm database hiển thị.
- Fake dữ liệu du lịch toàn quốc.
- Lưu lịch sử AI Chat dài hạn trong database ở giai đoạn hiện tại.

## Tiêu chí hoàn thành

Một thay đổi được coi là hoàn thành khi:

1. Không phá vỡ dữ liệu và API hiện có.
2. Có loading/error state phù hợp trên giao diện.
3. Lint, typecheck, build và test liên quan chạy thành công.
4. Không làm lộ secret.
5. Tài liệu/env example được cập nhật nếu cấu hình thay đổi.

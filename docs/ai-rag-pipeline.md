# Đường ống AI & Kỹ thuật RAG (AI & RAG Pipeline Deep Dive)

Tài liệu này phân tích chi tiết quy trình xử lý của chatbot AI, cơ chế RAG (Retrieval-Augmented Generation), luồng sinh lịch trình du lịch (Trip Planner), các cơ chế kiểm soát chi phí (Cost Guardrails) và bảo vệ hạ tầng.

---

## 1. Cơ chế hoạt động của AI Chat RAG

Chatbot AI của Vivu sử dụng mô hình RAG để khắc phục nhược điểm "ảo giác" (hallucination) của các mô hình ngôn ngữ lớn bằng cách cung cấp ngữ cảnh thực tế trước khi sinh câu trả lời.

```
                  [ Người dùng gửi Yêu cầu Chat ]
                                │
                 ┌──────────────┴──────────────┐
                 ▼ (Có ảnh)                    ▼ (Chỉ có chữ)
        [ Nén ảnh < 700KB ]           [ Trích xuất Embeddings ]
                 │                             │ (Qdrant Inference)
                 ▼                             ▼
      [ So khớp Ảnh trên S3 ]        [ Tìm Vector tương đồng ]
      (Qdrant Vision Model)           (text_collection_cloud)
                 │                             │
    ┌────────────┴────────────┐                ▼
    ▼ (Match > 0.25)          ▼ (Không khớp) [ Trích xuất Context ]
[ Đọc place_slug địa danh ] [ Bỏ qua ảnh ]     │
    │                         │                │
    └────────────┬────────────┘                │
                 ▼                             │
       [ Giới hạn bộ lọc ]                     │
    (Lọc context theo place_slug)              │
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                   [ Tổng hợp System Prompt ]
                 - Chỉ dùng context được cấp.
                 - Trả lời bằng tiếng Việt.
                 - Không tự chế thông tin liên lạc/giá.
                                │
                                ▼
                       [ AI text provider ]
                 (Conduit if enabled, Gemini fallback)
                                │
                                ▼
                    [ Trả kết quả cho Client ]
```

### A. Quy trình xử lý hình ảnh (Vision Pipeline)

1.  **Nén ảnh client-side**: Trước khi gửi ảnh qua mạng, mã JavaScript ở Client sử dụng Canvas API để resize và nén chất lượng ảnh về định dạng JPEG, đảm bảo kích thước file luôn dưới 700 KB để giảm băng thông và tăng tốc độ xử lý của mô hình Vision.
2.  **Trích xuất đặc trưng ảnh**: Backend gửi ảnh trực tiếp đến dịch vụ Qdrant Cloud Inference sử dụng mô hình Vision `qdrant/clip-vit-b-32-vision` để lấy vector đặc trưng.
3.  **So khớp đối tượng (Image Matching)**:
    - Hệ thống tìm kiếm vector ảnh tương đồng trong collection `image_collection_cloud`.
    - Nếu điểm tương đồng (similarity score) lớn hơn ngưỡng `IMAGE_MATCH_THRESHOLD` (mặc định `0.25`), hệ thống ghi nhận đã tìm thấy địa danh tương ứng và trích xuất `place_slug` của địa danh đó từ thông tin payload lưu trong vector.

### B. Quy trình truy xuất ngữ cảnh văn bản (Text RAG)

1.  **Embeddings Truy Vấn**: Từ khóa câu hỏi của người dùng được gửi sang Qdrant Cloud Inference để tạo vector embedding bằng mô hình `intfloat/multilingual-e5-small`. Cần lưu ý truy vấn được gửi đi luôn đính kèm tiền tố `query: ` theo đúng đặc tả của mô hình E5.
2.  **Lọc dữ liệu (Metadata Filtering)**:
    - Nếu ở bước xử lý ảnh Vision tìm thấy `place_slug` hợp lệ, API sẽ thiết lập một bộ lọc metadata (Filter) để giới hạn Qdrant chỉ tìm các vector văn bản có thuộc tính `place_slug` trùng khớp. Việc này giúp loại bỏ hoàn toàn các context không liên quan đến địa điểm người dùng đang hỏi trong ảnh.
    - Nếu không có ảnh, Qdrant tìm kiếm trên toàn bộ dữ liệu.
3.  **Tìm kiếm tương đồng (Vector Search)**: Qdrant tìm ra top `TOP_K_TEXT` (mặc định `5`) đoạn văn bản có độ tương đồng cao nhất để làm ngữ cảnh đầu vào (context).

### C. Prompt Engineering & Sinh câu trả lời (AI text provider)

Backend xây dựng prompt RAG theo cấu trúc cố định rồi gửi qua lớp `AiTextGenerationService`:

```
[Hệ thống chỉ thị]
Bạn là trợ lý du lịch Vivu AI chuyên về Gia Lai. Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên Ngữ Cảnh được cung cấp dưới đây.
Nguyên tắc bắt buộc:
1. Trả lời bằng tiếng Việt, thân thiện và lịch sự.
2. CHỈ sử dụng thông tin có trong Ngữ Cảnh. Không được suy đoán, không sử dụng kiến thức bên ngoài về các thông tin nhạy cảm như giá vé, số điện thoại, giờ mở cửa nếu ngữ cảnh không ghi rõ.
3. Nếu Ngữ Cảnh không đủ thông tin để trả lời câu hỏi, hãy nói rõ: "Tôi chưa có đủ thông tin chi tiết về vấn đề này để hỗ trợ bạn."

[Ngữ Cảnh]
{Danh sách các đoạn văn bản trích xuất từ Qdrant}

[Câu hỏi của người dùng]
{Nội dung tin nhắn người dùng}
```

Routing provider hiện tại:

- Text-only chat: nếu `CONDUIT_ENABLED=true`, backend thử Conduit trước bằng `CONDUIT_CHAT_MODEL`; nếu Conduit lỗi 401/402/403/429/5xx/timeout thì fallback sang Gemini khi Gemini có cấu hình.
- Image-only và image + text: vẫn dùng luồng nhận diện Qdrant và Gemini cho phần sinh câu trả lời vision/text. Conduit chưa được gọi cho luồng ảnh vì chưa xác nhận vision support.
- Backend không expose Conduit key ra frontend và không log full prompt hoặc API key.
- Với Conduit, dùng model id đầy đủ có namespace. Khuyến nghị production: `CONDUIT_CHAT_MODEL=openai/gpt-5-mini` cho chat text-only, `CONDUIT_TRIP_PLANNER_MODEL=anthropic/claude-sonnet-4-6` cho lập lịch trình; nếu cần tiết kiệm/giảm rate limit, dùng `google/gemini-2-5-flash`.

---

## 2. Luồng Lập lịch trình AI (AI Trip Planner Pipeline)

Hệ thống lập lịch trình được thiết kế nhằm mục đích giới thiệu các địa điểm du lịch có thật trong cơ sở dữ liệu của Vivu thay vì để AI tự vẽ ra các địa điểm không tồn tại:

1.  **Thu thập dữ liệu đầu vào**: Người dùng chọn vùng muốn đi (Ví dụ: `Pleiku`, `An Khê`), số ngày (1-5 ngày), sở thích (Ví dụ: `Thiên nhiên`, `Ẩm thực`).
2.  **Lấy danh sách địa danh thực tế (Candidate Places)**: Backend truy vấn PostgreSQL lấy toàn bộ danh sách địa danh khớp với vùng và danh mục sở thích đã chọn. Thông tin gửi đi chỉ gồm `name`, `slug`, `category`, `description` rút gọn để tiết kiệm token.
3.  **Yêu cầu AI provider sắp xếp lịch trình**:
    - Nếu `CONDUIT_ENABLED=true`, backend thử Conduit trước bằng `CONDUIT_TRIP_PLANNER_MODEL`.
    - Nếu Conduit lỗi/hết credit/rate limit/timeout, backend fallback sang Gemini khi Gemini có cấu hình.
    - Chỉ thị provider định dạng câu trả lời bắt buộc là cấu trúc JSON có schema định sẵn.
4.  **Kiểm tra và sửa lỗi lịch trình (Sanitization)**:
    - API nhận chuỗi JSON từ provider, parse thành đối tượng cấu trúc và chấp nhận JSON được bọc markdown hoặc có text bao quanh.
    - Quét qua từng ngày trong lịch trình, kiểm tra các `place_slug` do AI sắp xếp. Nếu phát hiện bất kỳ slug nào không nằm trong danh sách Candidate Places ban đầu (AI tự vẽ ra), hệ thống lập tức loại bỏ địa điểm đó khỏi lịch trình hoặc thay thế bằng địa điểm hợp lệ nhằm đảm bảo tính đúng đắn tối đa trước khi ghi vào database bảng `TripPlan`.

---

## 3. Các lớp bảo vệ & Giới hạn chi phí (Cost Guardrails)

Chi phí sử dụng các dịch vụ Cloud AI (Conduit, Gemini, Qdrant) có thể tăng phi mã nếu hệ thống bị tấn công spam bot. Vivu cấu hình các lớp bảo vệ sau:

### A. Hệ thống Rate Limiting & Quota sử dụng

- **Xác thực IP an toàn**: Hệ thống sử dụng địa chỉ IP của người dùng để làm định danh giới hạn. Để bảo mật và tuân thủ quyền riêng tư, IP được kết hợp với một chuỗi khóa bí mật `ABUSE_HASH_SECRET` và mã hóa một chiều (MD5/SHA256) trước khi ghi nhận lượt dùng.
- **Throttling**: Giới hạn tối đa 10 lượt chat AI trong vòng 5 phút trên mỗi IP hash.
- **Daily Quota**:
  - Người dùng vãng lai (chưa đăng nhập): Tối đa 5 lượt tạo lịch trình/ngày.
  - Người dùng thành viên (đã đăng nhập): Tối đa 20 lượt tạo lịch trình/ngày.

### B. Chiến lược Caching Lịch trình (Itinerary Caching)

- **Hoạt động**: Khi người dùng yêu cầu tạo lịch trình, backend băm (hash) các tham số đầu vào bao gồm: Khu vực, số ngày, sở thích, phương tiện di chuyển và ngôn ngữ để tạo thành một Cache Key duy nhất.
- **Xử lý**:
  - Hệ thống kiểm tra xem trong bảng `TripPlan` đã có bản ghi nào trùng khớp Cache Key này được tạo trong vòng 7 ngày qua chưa.
  - Nếu có, trả trực tiếp kết quả đã lưu trong DB cho người dùng mà không cần gọi sang Conduit/Gemini. Việc này giúp giảm chi phí gọi LLM về mức $0 và phản hồi gần như lập tức.

### C. Công tắc khẩn cấp (Emergency Switches)

Khi phát hiện chi phí tăng đột biến hoặc bị tấn công từ chối dịch vụ (DDoS) nhắm vào endpoint AI, người vận hành có thể tắt tính năng AI từ xa bằng cách cấu hình biến môi trường trên Vercel:

- Đặt `AI_FEATURE_ENABLED=false` để tạm ngắt tính năng Chatbot.
- Đặt `TRIP_PLANNER_FEATURE_ENABLED=false` để tạm dừng tính năng Lên lịch trình AI. Giao diện web sẽ tự động chuyển hướng người dùng sang trang gửi form tư vấn thủ công `/tu-van` để đội ngũ nhân sự chăm sóc khách hàng xử lý.

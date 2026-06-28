# Tổng quan hệ thống Vivu (Project Overview)

## 1. Giới thiệu Dự án
Vivu là một giải pháp chuyển đổi số toàn diện cho ngành du lịch tại khu vực tỉnh Gia Lai mới (bao gồm cả các đơn vị hành chính thuộc Bình Định cũ được sát nhập theo scope dữ liệu của dự án). Nền tảng được thiết kế nhằm giải quyết bài toán tiếp cận thông tin du lịch chính xác, cung cấp công cụ tự động lập kế hoạch hành trình bằng trí tuệ nhân tạo (AI Trip Planner), và tối ưu hóa chuyển đổi kinh doanh thông qua hệ thống CRM thu thập Lead và báo cáo dữ liệu trực tiếp.

```
                  ┌─────────────────────────────────┐
                  │          Browser Client         │
                  │   Next.js 14 Web (App Router)   │
                  └────────────────┬────────────────┘
                                   │
                         Same-Origin Proxy
                                   │
                                   v
                  ┌─────────────────────────────────┐
                  │          NestJS Gateway         │
                  │      (Fastify HTTP Server)      │
                  └──────┬───┬───┬───┬───┬───┬──────┘
         ┌───────────────┘   │   │   │   │   └───────────────┐
         v                   v   v   v   v                   v
┌──────────────────┐   ┌─────────┐   │   │   ┌───────────────┐   ┌────────────────┐
│ PostgreSQL/PostGIS│   │  AWS S3 │   │   │   │  Meilisearch  │   │  Google Gemini │
│  (Prisma ORM)    │   │ (Images)│   │   │   │(Search Engine)│   │ (Gemini Flash) │
└──────────────────┘   └─────────┘   │   │   └───────────────┘   └────────────────┘
                                     v   v
                      ┌─────────────────────────┐
                      │  Qdrant Cloud Inference │
                      │ (Vector Text / Vision)  │
                      └─────────────────────────┘
```

---

## 2. Phạm vi dữ liệu & Nguyên tắc thiết kế (Data Scope & Guidelines)

Dự án Vivu tuân thủ nghiêm ngặt **Ba nguyên tắc dữ liệu cốt lõi**:
1.  **PostgreSQL (với PostGIS)**: Là nguồn dữ liệu nghiệp vụ duy nhất (Source of Truth) được sử dụng để hiển thị thông tin trên Client. Mọi danh mục, khu vực, đánh giá, thông tin liên hệ và báo lỗi đều được lưu trữ và truy vấn từ đây.
2.  **AWS S3**: Lưu trữ toàn bộ tài nguyên hình ảnh địa danh. Client không có quyền đọc trực tiếp từ S3 bucket để đảm bảo an ninh thông tin. Tất cả hình ảnh hiển thị trên frontend được backend cấp quyền truy cập gián tiếp thông qua S3 Presigned URL có giới hạn thời gian (TTL).
3.  **Qdrant Cloud**: Chỉ phục vụ mục đích truy vấn tìm kiếm vector ngữ cảnh (Vector Retrieval) cho chatbot AI và tính năng RAG. Qdrant hoàn toàn không lưu trữ dữ liệu nghiệp vụ và không thay thế cho PostgreSQL.

---

## 3. Các phân hệ và Luồng tính năng chi tiết

### A. Phân hệ Khám phá & Bản đồ (Explore & Map)
*   **Trang Khám Phá (`/kham-pha`)**: Cung cấp bộ lọc đa chiều (danh mục địa điểm, địa bàn quận/huyện/thành phố). Giao diện tối ưu trải nghiệm người dùng bằng cách xử lý triệt để các trạng thái tải dữ liệu (Skeleton loading), xử lý lỗi API mượt mà và ẩn các thẻ ảnh bị lỗi thay vì hiển thị hình ảnh lỗi.
*   **Trang Chi Tiết Địa Danh (`/dia-diem/[slug]`)**: Chứa thông tin mô tả chi tiết, bộ sưu tập hình ảnh (photo gallery), danh sách đánh giá từ cộng đồng, bản đồ vị trí thực tế của địa điểm và nút Báo lỗi dữ liệu tích hợp để người dùng phản hồi thông tin sai lệch trực tiếp cho ban quản trị.
*   **Trang Bản Đồ (`/ban-do`)**: Sử dụng thư viện Leaflet vẽ bản đồ tương tác hiển thị các địa danh du lịch. Hệ thống chỉ hiển thị marker cho các địa danh đã được kiểm chứng và có tọa độ (Vĩ độ/Kinh độ) hợp lệ trong database. Nếu tọa độ không hợp lệ, hệ thống sẽ ẩn hoặc chuyển sang trạng thái đang cập nhật để tránh định vị sai cho khách du lịch.

### B. Phân hệ Trợ lý AI Du lịch (AI Chat RAG)
Tích hợp tại trang `/ai-chat`, cho phép du khách trò chuyện và hỏi thông tin về du lịch Gia Lai. Hệ thống sử dụng mô hình RAG (Retrieval-Augmented Generation) để đảm bảo câu trả lời của AI bám sát dữ liệu thực tế:
*   **Chế độ chỉ nhập văn bản (Text-only)**: Trích xuất context liên quan từ Qdrant Cloud dựa trên độ tương đồng ngữ nghĩa của câu hỏi, gửi kèm prompt sang Gemini để sinh câu trả lời bằng tiếng Việt.
*   **Chế độ chỉ gửi ảnh (Image-only)**: Client tự động nén dung lượng ảnh trước khi tải lên (giữ dưới 700 KB). Backend sử dụng model vision của Qdrant Cloud để đối chiếu đặc trưng ảnh. Nếu phát hiện địa điểm trùng khớp với độ tin cậy cao, hệ thống trả thẳng thông tin địa danh đó mà không cần gọi Gemini.
*   **Chế độ kết hợp (Image + Text)**: Xác định địa điểm thông qua ảnh trước, sau đó dùng chính ID của địa điểm đó làm bộ lọc (metadata filter) để thu hẹp không gian tìm kiếm context văn bản trong Qdrant Cloud trước khi gửi yêu cầu đến Gemini.

### C. Phân hệ Lên lịch trình tự động (AI Trip Planner)
Tích hợp tại trang `/lich-trinh`, cho phép lập kế hoạch hành trình du lịch tối ưu:
*   Người dùng cung cấp: Số ngày đi, khu vực mong muốn, phương tiện di chuyển và sở thích cá nhân.
*   Backend truy vấn danh sách địa điểm thực tế từ PostgreSQL rồi gửi kèm chỉ thị (system prompt) cho Gemini để sắp xếp.
*   Hệ thống thực hiện kiểm tra chéo (cross-validation) ở backend, loại bỏ bất kỳ địa điểm nào bị Gemini tự biên soạn (ảo giác) không khớp với dữ liệu thực tế trong database trước khi trả lịch trình về cho người dùng.

### D. Phân hệ CRM & Quản trị (CRM & Admin Panel)
*   **Thu thập khách hàng tiềm năng (Lead Capture) (`/tu-van`)**: Cho phép khách hàng gửi thông tin liên hệ khi có nhu cầu đặt tour hoặc tư vấn chuyến đi riêng.
*   **Báo lỗi dữ liệu (Data Report)**: Nơi tiếp nhận thông tin phản ánh sai sót về hình ảnh, mô tả hoặc tọa độ địa danh trên trang chi tiết.
*   **Admin Dashboard (`/admin`)**: Cổng quản trị dành cho vận hành viên để quản lý danh sách địa danh, phê duyệt/ẩn đánh giá, xem thống kê tương tác thời gian thực (real-time analytics) và xử lý danh sách lead/report thông qua giao diện cập nhật trạng thái trực quan.

---

## 4. Đường dẫn triển khai (Production Environments)

*   **Giao diện Web công khai**: [https://vivu-web.vercel.app](https://vivu-web.vercel.app)
*   **Cổng API Gateway**: [https://vivu-api.vercel.app](https://vivu-api.vercel.app)
*   **Trang thông tin build Web**: [https://vivu-web.vercel.app/build-info](https://vivu-web.vercel.app/build-info)
*   **Trang thông tin build API**: [https://vivu-api.vercel.app/api/v1/build-info](https://vivu-api.vercel.app/api/v1/build-info)

# Tài liệu Đặc Tả API Routes (API Specifications & Contracts)

Tài liệu này cung cấp chi tiết về định dạng URL, phương thức HTTP, cấu trúc tham số đầu vào (Headers, Query, Body) và định dạng dữ liệu trả về (JSON Response) của các API chính trong hệ thống Vivu.

---

## 1. Thông tin chung

*   **Endpoint gốc (Production Base URL)**: `https://vivu-api.vercel.app/api/v1`
*   **Định dạng dữ liệu**: Toàn bộ dữ liệu gửi đi và nhận về sử dụng chuẩn `application/json`, ngoại trừ các API upload file sử dụng `multipart/form-data`.
*   **Mã trạng thái HTTP chuẩn**:
    *   `200 OK`: Truy vấn dữ liệu thành công.
    *   `201 Created`: Tạo mới bản ghi thành công (POST requests).
    *   `400 Bad Request`: Dữ liệu gửi lên không hợp lệ (sai định dạng, thiếu trường bắt buộc).
    *   `401 Unauthorized`: Yêu cầu token xác thực hoặc token hết hạn.
    *   `403 Forbidden`: Tài khoản không có đủ quyền truy cập (thiếu Role admin/editor).
    *   `429 Too Many Requests`: Vượt quá giới hạn rate limit/quota.
    *   `500 Internal Server Error`: Lỗi phát sinh từ hệ thống server backend.

---

## 2. API Công khai (Public Endpoints)

### A. Lấy danh sách địa danh
*   **Endpoint**: `GET /places`
*   **Query Parameters**:
    *   `page` (number, optional, default: `1`): Trang cần lấy.
    *   `limit` (number, optional, default: `12`, max: `50`): Số lượng bản ghi trên mỗi trang.
    *   `category` (string, optional): Lọc theo slug danh mục (Ví dụ: `thac-suoi`).
    *   `region` (string, optional): Lọc theo slug khu vực (Ví dụ: `pleiku`).
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "clxb1...",
          "name": "Biển Hồ Pleiku",
          "slug": "bien-ho",
          "description": "Hồ nước ngọt tự nhiên nằm tại phía bắc thành phố Pleiku...",
          "heroImageUrl": "https://s3.ap-southeast-1.amazonaws.com/.../bien-ho.jpg?AWSAccessKeyId=...",
          "latitude": 14.0435,
          "longitude": 108.0123,
          "category": {
            "name": "Thiên nhiên",
            "slug": "thien-nhien"
          }
        }
      ],
      "meta": {
        "total": 45,
        "page": 1,
        "limit": 12,
        "totalPages": 4
      }
    }
    ```

### B. Tìm các địa danh lân cận (Nearby Places)
*   **Endpoint**: `GET /places/nearby`
*   **Query Parameters**:
    *   `lat` (number, required): Vĩ độ của điểm trung tâm.
    *   `lng` (number, required): Kinh độ của điểm trung tâm.
    *   `radiusKm` (number, optional, default: `10`): Bán kính tìm kiếm tính bằng kilomet.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "name": "Chùa Minh Thành",
          "slug": "chua-minh-thanh",
          "distanceKm": 2.4
        }
      ]
    }
    ```

### C. Xem chi tiết địa danh
*   **Endpoint**: `GET /places/:slug`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "clxb1...",
        "name": "Biển Hồ Pleiku",
        "slug": "bien-ho",
        "content": "Bài viết giới thiệu chi tiết về lịch sử hình thành...",
        "heroImageUrl": "https://...",
        "latitude": 14.0435,
        "longitude": 108.0123,
        "images": [
          "https://.../img1.jpg",
          "https://.../img2.jpg"
        ]
      }
    }
    ```

---

## 3. API Trợ lý AI & Lập Lịch Trình (AI & Trip Planner Endpoints)

### A. Gửi tin nhắn chat AI
*   **Endpoint**: `POST /ai/chat`
*   **Headers**: `Content-Type: multipart/form-data`
*   **Request Body**:
    *   `message` (string, optional): Nội dung câu hỏi của người dùng.
    *   `session_id` (string, optional): ID phiên chat để duy trì hội thoại ngắn.
    *   `image` (file, optional): File hình ảnh đính kèm (chỉ nhận PNG, JPEG, WebP, dung lượng tối đa 4MB).
    *   *Lưu ý*: Request bắt buộc phải có ít nhất `message` hoặc `image`.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "answer": "Biển Hồ (hay hồ T'Nưng) là một hồ nước ngọt tự nhiên nằm ở phía Bắc thành phố Pleiku...",
        "sources": [
          {
            "title": "Giới thiệu Biển Hồ",
            "placeSlug": "bien-ho"
          }
        ],
        "matchedPlace": {
          "name": "Biển Hồ Pleiku",
          "slug": "bien-ho"
        }
      }
    }
    ```

### B. Tạo lịch trình chuyến đi bằng AI
*   **Endpoint**: `POST /trip-plans/generate`
*   **Request Body**:
    ```json
    {
      "region": "pleiku",
      "days": 2,
      "interests": ["thien-nhien", "van-hoa"],
      "transport": "xe_may",
      "locale": "vi"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "plan_clxc...",
        "title": "Hành trình khám phá Pleiku 2 ngày bằng Xe máy",
        "days": [
          {
            "day": 1,
            "activities": [
              {
                "time": "08:00",
                "placeName": "Biển Hồ Pleiku",
                "placeSlug": "bien-ho",
                "note": "Tham quan chụp ảnh lòng hồ buổi sáng mát mẻ."
              }
            ]
          }
        ]
      }
    }
    ```

---

## 4. API Thu thập thông tin (Leads & Reports Endpoints)

### A. Gửi yêu cầu tư vấn du lịch (Lead Capture)
*   **Endpoint**: `POST /leads`
*   **Request Body**:
    ```json
    {
      "name": "Nguyễn Văn A",
      "phoneOrZalo": "0901234567",
      "notes": "Muốn đặt tour Pleiku 3 ngày cho gia đình 4 người.",
      "website": "" 
    }
    ```
    *   *Lưu ý*: Trường `website` là honeypot field dùng để chống spam. Nếu trường này có giá trị (do bot tự điền), API sẽ lập tức từ chối xử lý và trả về mã thành công giả hoặc lỗi.
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Gửi yêu cầu tư vấn thành công!"
    }
    ```

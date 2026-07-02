# Hướng dẫn chi tiết Quy trình Kiểm thử (Comprehensive Testing Guide)

Tài liệu này đặc tả toàn bộ quy trình kiểm thử chất lượng phần mềm trong dự án Vivu, bao gồm cấu hình môi trường, hướng dẫn viết test case, chạy test tự động và cách phân tích kết quả lỗi.

---

## 1. Các lớp kiểm thử (Test Architecture)

Hệ thống Vivu triển khai mô hình kim tự tháp kiểm thử (Testing Pyramid) để đảm bảo độ tin cậy của mã nguồn:

```
      / \
     /   \     E2E Tests (Playwright / UI Flows)
    / E2E \    <- Thử nghiệm giao diện người dùng thực tế
   /───────\
  /  Int   \   Integration Tests (Jest / PostgreSQL / PostGIS)
 /──────────\  <- Kiểm thử tích hợp dịch vụ, truy vấn database
/    Unit    \  Unit Tests (Jest / Logic Services & Helpers)
/─────────────\ <- Kiểm tra các hàm logic biệt lập
```

---

## 2. Kiểm thử Tĩnh & Biên dịch (Static Testing)

Trước khi thực thi mã nguồn, hệ thống chạy kiểm tra tĩnh để loại bỏ các lỗi cú pháp và kiểu dữ liệu:

*   **ESLint**: Quét toàn bộ mã nguồn để phát hiện code thừa, sai cấu trúc hoặc không tuân thủ quy ước coding style của dự án.
    *   *Lệnh thực thi*: `pnpm lint`
*   **TypeScript Check**: Trình biên dịch tsc kiểm tra tính hợp lệ của kiểu dữ liệu (Types).
    *   *Lệnh thực thi*: `pnpm typecheck`
    *   *Lưu ý*: Script này tự động chạy bước sinh mã Prisma Client (`prisma:generate`) trước để tránh lỗi thiếu kiểu dữ liệu từ database.

---

## 3. Kiểm thử Đơn vị Backend (Unit Testing)

Unit test tập trung kiểm tra logic độc lập của các hàm service, helper mà không kết nối cơ sở dữ liệu hoặc gọi mạng thực tế (sử dụng Mocking).

*   **Thư viện**: Sử dụng Jest làm test runner.
*   **Cấu hình**: Xem chi tiết tại `apps/api/jest.config.js`.
*   **Lệnh chạy test**:
    ```bash
    pnpm --filter @vivu/api test
    ```
*   **Ví dụ Mocking trong AI Chat Service Test**:
    Khi test logic xử lý câu trả lời của AI, hệ thống thực hiện mock (giả lập) kết quả trả về từ Gemini hoặc Conduit để tránh việc tiêu tốn token thực tế và đảm bảo tốc độ chạy test nhanh. Conduit luôn được mock qua service/fetch mock, không dùng key thật trong unit test:
    ```typescript
    jest.spyOn(aiTextGenerationService, 'generateTravelAnswer').mockResolvedValue('Đây là câu trả lời giả lập về Biển Hồ');
    ```

---

## 4. Kiểm thử Tích hợp Backend (Integration Testing)

Kiểm thử tích hợp xác thực khả năng tương tác chính xác giữa NestJS Services với cơ sở dữ liệu PostgreSQL thực tế có kích hoạt PostGIS extension.

*   **Yêu cầu môi trường**: Phải có một container database PostgreSQL đang chạy cục bộ (thường qua Docker Compose).
*   **Cơ chế hoạt động**:
    *   Mỗi khi chạy test, hệ thống tự động thiết lập một cơ sở dữ liệu tạm thời (test database schema).
    *   Chạy các lệnh tạo bảng (Prisma migrate) và nạp dữ liệu mẫu (Seeding).
    *   Thực thi các test case gọi trực tiếp vào database (Ví dụ: kiểm tra hàm tính khoảng cách địa lý `places/nearby`).
    *   Dọn dẹp và xóa cơ sở dữ liệu tạm sau khi hoàn tất.
*   **Lệnh chạy test**:
    ```bash
    pnpm --filter @vivu/api test:int
    ```

---

## 5. Kiểm thử Giao diện Toàn trình (E2E Playwright Testing)

Kiểm thử E2E sử dụng Playwright để mô phỏng hành vi của người dùng thực tế trên trình duyệt (Click chuột, nhập form, cuộn trang).

*   **Cấu hình chính**: Xem chi tiết tại file `apps/web/playwright.config.ts`.
*   **Lệnh chạy test**:
    ```bash
    # Local/dev friendly: Playwright tự động chạy Next dev ở port 3100
    pnpm --filter @vivu/web test:e2e

    # Từ root workspace, script này trỏ vào app web
    pnpm e2e:web

    # Chạy test E2E trỏ về ứng dụng trên môi trường production
    E2E_BASE_URL=https://vivu-web.vercel.app pnpm e2e:web
    ```
    Khi không có `E2E_BASE_URL`, `apps/web/playwright.config.ts` dùng `pnpm exec next dev -p 3100` để tránh lỗi `next start` khi chưa có production build. E2E smoke mặc định dùng `https://vivu-api.vercel.app` làm API công khai; đặt `E2E_API_URL` hoặc `NEXT_PUBLIC_API_URL` nếu cần trỏ về API local.
*   **Nguyên tắc viết E2E test**:
    *   Sử dụng thuộc tính `data-testid` trên các thẻ HTML để làm bộ định vị (selectors) thay vì sử dụng CSS class (vì class dễ bị thay đổi khi cập nhật giao diện).
    *   *Ví dụ*: `page.locator('[data-testid="btn-submit-lead"]').click()`.
    *   **Mock AI APIs**: E2E test không được gọi API sinh lịch trình thật để tránh phát sinh chi phí billing. Playwright được cấu hình chặn request `/api/v1/trip-plans/generate` hoặc route proxy `/api/trip-plans/generate` và trả về kết quả JSON mock cố định. Không gọi Conduit thật trong E2E, không dùng `CONDUIT_API_KEY` thật, và không tạo biến frontend kiểu `NEXT_PUBLIC_CONDUIT_API_KEY`.
    *   **Auth rollback coverage**: E2E smoke phải xác nhận `/dang-nhap` và
        `/dang-ky` render form Vivu nội bộ, signed-out header có hành động đăng
        nhập/đăng ký, và protected pages redirect về login khi chưa có session.
        Không dùng hosted auth widgets trong E2E.

---

## 6. Phân tích kết quả kiểm thử lỗi (Debugging Playwright)

Khi một test case E2E bị lỗi trên CI/CD hoặc local, thực hiện các bước sau để tìm nguyên nhân:

1.  **Xem HTML Report**:
    ```bash
    npx playwright show-report apps/web/test-results
    ```
2.  **Sử dụng Trace Viewer**:
    Mở file trace ghi hình lại toàn bộ quá trình chạy test để xem trạng thái màn hình tại đúng thời điểm phát sinh lỗi:
    ```bash
    npx playwright show-trace apps/web/test-results/xxxx/trace.zip
    ```

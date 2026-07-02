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
    Khi test logic xử lý câu trả lời của AI, hệ thống thực hiện mock (giả lập) kết quả trả về từ Gemini API để tránh việc tiêu tốn token thực tế và đảm bảo tốc độ chạy test nhanh:
    ```typescript
    jest.spyOn(geminiService, 'generateText').mockResolvedValue('Đây là câu trả lời giả lập về Biển Hồ');
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
    *   **Mock AI APIs**: E2E test không được gọi API sinh lịch trình thật để tránh phát sinh chi phí billing. Playwright được cấu hình chặn request `/api/v1/trip-plans/generate` và trả về kết quả JSON mock cố định.

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
---

## 7. Clerk Auth Migration Coverage

Unit tests cover the Clerk auth bridge without network calls:

* mocked Clerk token verification and `/auth/me` style upsert;
* exact-email link that preserves existing `admin`/`editor` DB roles;
* missing token rejection;
* Clerk webhook invalid signature, `user.created`, and `user.deleted`.

Frontend E2E should keep public pages reachable with no Clerk keys. When Clerk
keys are enabled in a dedicated environment, add signed-out header, protected
redirect, and post-login `/auth/me` assertions with mocked Clerk/browser state.
Do not call real Gemini or paid AI APIs from E2E.

Current web smoke coverage includes `/dang-nhap` and `/dang-ky` rendering the
Vivu auth shell, benefit list, and an auth form without a real Clerk login. It
also checks the signed-out header actions, `/en/dang-nhap` English copy, and
mobile 390px no-horizontal-scroll coverage for the auth pages.

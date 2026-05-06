# Vivu — Tài liệu dự án (PROJECT)

> Đây là **tài liệu charter** của dự án: định hình _vì sao_, _cho ai_, _làm gì_, _không làm gì_, và _đo bằng cái gì_. Phần thiết kế kỹ thuật chi tiết nằm ở [`DESIGN.md`](./DESIGN.md). Tài liệu tổng quan đầy đủ (bao trùm cả product + engineering) ở [`docs/overview.md`](./docs/overview.md).

---

## 1. Tóm tắt 1 dòng

**Vivu** là portal **tra cứu địa điểm du lịch Việt Nam** — khám phá, lưu trữ và chia sẻ thông tin du lịch một cách nhẹ nhàng, không thương mại.

## 2. Vấn đề giải quyết

Người Việt (và du khách quốc tế) đang gặp các trở ngại khi tìm hiểu địa điểm du lịch:

- Thông tin **rời rạc**, phải Google rồi tổng hợp thủ công.
- Phần lớn nội dung từ OTA / blog mang **mục đích bán hàng**, người dùng phải tự lọc.
- Khó **lưu lại** và **tổ chức** danh sách điểm đến muốn đi cho từng chuyến.
- Tiếng Việt có dấu / không dấu, đa vùng miền — search trên hệ thống chung thường yếu.

Vivu trả lời bằng một sản phẩm thuần "tra cứu", **không bán gì**, tập trung vào chất lượng nội dung và trải nghiệm tìm kiếm.

## 3. Tuyên ngôn phạm vi (Scope statement)

### In scope (làm)

- Thư viện địa điểm có cấu trúc (đa ngôn ngữ vi/en).
- Tìm kiếm typeahead + faceted filter.
- Trang chi tiết địa điểm với mô tả dài, ảnh, bản đồ, mùa đẹp, gợi ý lân cận.
- Bản đồ tương tác với clustering POI.
- Tài khoản: yêu thích, sổ tay (collections), review, Q&A.
- Khu vực admin/editor: CRUD địa điểm, duyệt nội dung.
- SEO + đa ngôn ngữ (vi mặc định, en).
- Đề xuất theo mùa / vùng / chủ đề.

### Out of scope (KHÔNG làm)

- Đặt phòng / vé máy bay / tour / vé tham quan.
- Thanh toán, ví, hóa đơn, hoàn hủy, escrow.
- Tích hợp GDS / OTA / nhà cung cấp inventory thương mại.
- Coupon / khuyến mãi / chương trình affiliate.
- Quản lý kho phòng, giá động, booking orchestration.
- Mạng xã hội đầy đủ (DM, follow, feed thuật toán, livestream).

> Bất kỳ thay đổi phạm vi nào đụng vào nhóm "Out of scope" đều cần thảo luận lại với chủ dự án trước khi lên kế hoạch implement.

## 4. Personas

| Persona                | Mô tả                                                         | Cần gì ở Vivu                                          |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| **Khách tự túc**       | Người 18–45 đi tự túc, lên kế hoạch trước 1–4 tuần.           | Tìm nhanh điểm đến, biết mùa đẹp, lưu list.            |
| **Người lập kế hoạch** | Có nhóm bạn / gia đình, cần tổ chức danh sách điểm theo ngày. | Tạo collection, sắp xếp, ghi chú riêng.                |
| **Cộng đồng đóng góp** | User active muốn chia sẻ kinh nghiệm.                         | Viết review, trả lời Q&A, gợi ý điểm mới.              |
| **Editor / admin**     | Người duy trì nội dung (bạn / cộng tác viên).                 | CRUD địa điểm, kiểm duyệt review, theo dõi chất lượng. |
| **Khách quốc tế**      | Du khách inbound đang tra cứu Việt Nam.                       | Bản tiếng Anh, SEO tốt, ảnh đẹp.                       |

## 5. Mục tiêu & chỉ số thành công (success metrics)

### North star

> **Số "địa điểm được lưu vào sổ tay" mỗi tuần** — đại diện cho ý định du lịch thực sự.

### Mục tiêu định tính

- Tra cứu nhanh hơn so với tự Google (cảm nhận chủ quan của user).
- Nội dung sạch, không spam quảng cáo.
- Cộng đồng review chất lượng, ít nội dung độc hại.

### Chỉ số định lượng (theo phase)

| Phase | KPI                                 | Mục tiêu |
| ----- | ----------------------------------- | -------- |
| MVP   | Số địa điểm published               | ≥ 100    |
| MVP   | LCP mobile (4G)                     | < 2.5s   |
| v1    | Số user đăng ký active / tuần (WAU) | ≥ 200    |
| v1    | Số "lưu địa điểm" / tuần            | ≥ 500    |
| v1    | Số review hợp lệ / tuần             | ≥ 50     |
| v2    | Tỷ lệ reviews bị ẩn / tổng review   | < 5%     |
| v2    | Search → click rate                 | ≥ 40%    |

## 6. Nguyên tắc thiết kế (design principles)

1. **Tra cứu trước, mọi thứ khác sau.** Mọi tính năng phải làm cho việc tìm/đọc/lưu nhanh hơn, không cản trở.
2. **Không thương mại.** Không CTA mua tour, không banner đặt phòng. Nếu cần tài trợ chi phí hạ tầng sau này, sẽ là quyên góp / đối tác nội dung — không phải bán hàng.
3. **Dữ liệu sạch quan trọng hơn nhiều dữ liệu.** Thà 100 điểm chất lượng còn hơn 10.000 điểm dở.
4. **Mobile-first.** Người Việt tra cứu chủ yếu trên điện thoại.
5. **Đa ngôn ngữ ngay từ đầu.** Mỗi địa điểm có vi/en, fallback vi.
6. **Mở dữ liệu khi có thể.** Sau v1 sẽ mở public read-only API.
7. **Bảo vệ user.** Không thu thập PII không cần. Mặc định privacy-first.

## 7. Stakeholders

- **Chủ dự án (Product Owner):** Trung Hieu (`@dinhvien04`).
- **Engineering / Devin AI:** scaffold, code, review.
- **Editor (sau MVP):** dự kiến mời cộng tác viên review nội dung.
- **End users:** khách du lịch & cộng đồng đóng góp.

## 8. Lộ trình (roadmap)

> Lịch chi tiết theo tuần xem `docs/overview.md` mục 12. Đây là tóm tắt cao tầng.

### MVP (4–6 tuần)

- Schema DB + seed ~100 địa điểm.
- Auth (email + Google).
- Trang chủ, search cơ bản, list, detail địa điểm.
- Bản đồ tương tác cơ bản.
- Favorites.
- Admin CRUD địa điểm.
- Deploy staging.

### v1 (4 tuần)

- Reviews + ảnh.
- Collections / sổ tay.
- Search nâng cao (MeiliSearch + typeahead).
- i18n vi/en đầy đủ.
- SEO + JSON-LD + sitemap.
- Observability cơ bản.

### v1.x

- Q&A.
- Editorial (bài chủ đề MDX).
- Đề xuất theo mùa + theo lịch sử.
- PWA (offline cho địa điểm đã lưu).

### v2

- UGC có duyệt (cộng đồng đóng góp địa điểm mới).
- Heatmap, route preview.
- Public read-only API cho dev khác.

## 9. Rủi ro & giả định

| Rủi ro / Giả định                             | Tác động | Mitigation                                                  |
| --------------------------------------------- | -------- | ----------------------------------------------------------- |
| Khó thu hút seed content chất lượng cho MVP.  | Cao      | Editor team nhỏ + dùng nguồn mở (OSM, Wikipedia) + tự viết. |
| Spam review / nội dung độc hại.               | Trung    | Hệ thống report + duyệt + rate-limit + soft-ban.            |
| Bot/scraping toàn bộ DB.                      | Trung    | Rate-limit, robots, watermark ảnh, public API có quota sau. |
| Chi phí bản đồ tăng nếu dùng Mapbox.          | Thấp     | Bắt đầu với Leaflet + OSM, chỉ chuyển nếu cần.              |
| Pháp lý nội dung review (bôi nhọ địa điểm).   | Trung    | Có cơ chế report + takedown, lưu audit log.                 |
| User mong đợi đặt phòng, hiểu nhầm thành OTA. | Trung    | UI nói rõ "Vivu chỉ là tra cứu" + FAQ.                      |

## 10. Quy ước

### Branching

- `main` — production, luôn deploy được.
- `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`, `refactor/<scope>` — feature branches.
- Không push thẳng vào `main`. Mọi thay đổi qua PR.

### Commits

- [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`...
- Mỗi commit nên là 1 đơn vị logic độc lập, build pass.

### Pull Request

- 1 PR = 1 chủ đề. PR < 400 dòng diff khi có thể.
- Tiêu đề PR theo Conventional Commits.
- Phải pass: format, lint, typecheck, build, test (CI).
- Có ít nhất 1 reviewer trừ khi là `docs:` thuần.
- Squash merge vào `main` để giữ history sạch.

### Code style

- TypeScript strict bật toàn repo. **Không** dùng `any` trừ khi có comment giải thích.
- Prettier + ESLint quản lý style — không tranh luận về formatting.
- Tên hàm/biến tiếng Anh. Comment trong code có thể tiếng Việt khi giải thích nghiệp vụ tiếng Việt (mùa, tỉnh thành, danh xưng).
- Mọi public API (controller / hook) có JSDoc tiếng Việt mô tả ngắn.

### Definition of Done

Một feature done khi:

- Có DTO + validation + test ở BE.
- UI responsive (mobile-first), có state loading / empty / error.
- Có test E2E cho happy path.
- Có log + metric phù hợp.
- Đã pass CI + review + deploy staging.
- Tài liệu được cập nhật nếu thay đổi public API.

## 11. Đóng góp

Hiện dự án là **closed-source** trong giai đoạn MVP. Sau v1 có thể cân nhắc mở mã (license MIT hoặc AGPL) cho phần frontend / packages chung.

Quy trình đóng góp nội bộ:

1. Mở issue mô tả vấn đề / đề xuất.
2. Thảo luận hướng giải quyết với chủ dự án trước khi code (nếu thay đổi >100 dòng).
3. Mở PR theo quy ước trên.
4. Nhận review, sửa, merge.

## 12. License

Chưa quyết định. Tạm thời: **All rights reserved** với chủ sở hữu `@dinhvien04` cho đến khi có quyết định khác.

## 13. Liên hệ

- Repo: <https://github.com/dinhvien04/vivu>
- Issue: <https://github.com/dinhvien04/vivu/issues>
- Owner: `@dinhvien04`

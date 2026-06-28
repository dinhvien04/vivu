# Top Places Data Checklist

Cập nhật: 24/06/2026.

Checklist này chuẩn hóa 20 địa danh ưu tiên để web, bản đồ, tư vấn và AI có dữ liệu đủ dùng. Không hard-code dữ liệu này vào frontend; database/backend vẫn là nguồn chính.

## Quy Chuẩn Cho Mỗi Địa Danh

- [ ] Vì sao nên đi.
- [ ] Mùa đẹp.
- [ ] Thời lượng tham quan.
- [ ] Cách đi.
- [ ] Điểm gần đó.
- [ ] Hoạt động nên làm.
- [ ] Lưu ý an toàn.
- [ ] Gợi ý lịch trình 1 buổi / 1 ngày.
- [ ] FAQ.
- [ ] Nguồn tham khảo.
- [ ] Ảnh hero đẹp.
- [ ] Ảnh gallery sạch.
- [ ] Tọa độ đã kiểm.
- [ ] RAG text đủ sâu.
- [ ] AI test question pass.

## Danh Sách Ưu Tiên

1. Eo Gió
2. Kỳ Co
3. Cù Lao Xanh
4. Biển Hồ
5. Biển Hồ Chè
6. Tháp Bánh Ít
7. Đầm Thị Nại
8. Bảo tàng Quang Trung
9. Bãi Xép
10. Biển Quy Nhơn
11. Biển Quy Hòa
12. Đồi cỏ hồng Đắk Đoa
13. Chùa Ông Núi
14. Tháp Đôi
15. Ghềnh Ráng Tiên Sa
16. Hòn Khô
17. Nhơn Lý
18. Nhơn Hải
19. Bảo tàng tỉnh Gia Lai
20. Núi lửa Chư Đăng Ya

## Mẫu Kiểm Một Địa Danh

Sao chép block này cho từng địa danh khi biên tập dữ liệu:

- [ ] Tên tiếng Việt đúng dấu.
- [ ] Slug ổn định.
- [ ] Category đúng.
- [ ] Province dùng Gia Lai theo scope hiện tại, có thể ghi chú Bình Định cũ trong mô tả nếu cần.
- [ ] Summary ngắn dưới 300 ký tự.
- [ ] Description chỉ lấy phần giới thiệu địa điểm, không nhét tài liệu quá dài.
- [ ] Hero image hiển thị được.
- [ ] Gallery không có ảnh lỗi/đen/vỡ.
- [ ] Tọa độ có confidence/source nếu chưa chắc.
- [ ] Có ít nhất 3 câu hỏi AI test:
  - Nơi này có gì đẹp?
  - Nên đi mùa nào?
  - Gợi ý lịch trình nửa ngày/1 ngày.

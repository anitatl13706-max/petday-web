# PetDay V6.30 – Booking Experience & Admin Operations

## Nâng cấp (không có SQL mới)
- Bộ lọc Admin nâng cao theo chi nhánh và khoảng ngày, dùng cùng danh sách cho xuất CSV.
- Khi không có kết quả, nút Xóa bộ lọc làm sạch cả các bộ lọc nâng cao.
- Khách thấy thanh tiến trình 4 giai đoạn trong từng thẻ lịch, trạng thái thanh toán hiển thị độc lập.
- Không sửa quyền truy cập, trạng thái booking hoặc tính tiền ở backend.

## Kiểm thử chấp nhận
1. Admin chọn chi nhánh A → chỉ hiển thị lịch chi nhánh A; xuất CSV có cùng tập dữ liệu.
2. Chọn ngày bắt đầu và kết thúc bằng nhau → vẫn hiển thị lịch của ngày đó.
3. Chọn bộ lọc không có kết quả → bấm Xóa bộ lọc → trở lại tất cả lịch.
4. Customer có lịch Đang chờ xác nhận / Đã xác nhận / Đang thực hiện / Hoàn tất → từng thanh tiến trình đánh đúng bước.
5. Lịch Đã hủy không có thanh đang chăm sóc; thanh toán chỉ đọc từ paymentStatus, không tự chuyển trạng thái.
6. Màn hình 360px, 768px, 1440px: thẻ, filter và nút phải không tràn, truy cập bàn phím được.
7. Test chức năng thanh toán tiền mặt và chuyển khoản, thay đổi trạng thái dịch vụ độc lập với payment_status.
8. Test Admin, Customer, Staff với tài khoản riêng để xác thực phân quyền trước khi nộp.

## Ghi chú
Kết quả unit test không thay thế build production và kiểm thử tích hợp PostgreSQL. Không cần chạy migration SQL mới từ V6.29 sang V6.30, nhưng database phải đã đủ migration 001–020.

# PetDay V6.31 — Sổ thu tiền & chỉnh giao diện quản trị

## Phạm vi
- Thêm sổ thu tiền trong tab **Tài chính** của Admin, sử dụng GET /bookings và endpoint cập nhật thanh toán đã tồn tại.
- Lọc chưa thanh toán/đã thanh toán, tìm mã lịch, thú cưng, khách, và xác nhận khoản tiền đã nhận.
- Chuyển khoản bắt buộc nhập mã giao dịch đã đối soát. Có hộp xác nhận trước khi gửi.
- Không ghi nhận tiền tự động khi khách chọn phương thức thanh toán.
- Không thêm SQL mới; dùng database đã nâng cấp đến SQL 020.

## Kiểm thử thủ công
1. Đăng nhập Admin > Tài chính > Sổ thu tiền: lịch chưa thu xuất hiện, tổng cần kiểm tra tính đúng.
2. Tìm mã lịch; chuyển giữa 3 bộ lọc, kết quả đúng.
3. Lịch chuyển khoản chưa có mã giao dịch: thao tác bị từ chối ở giao diện.
4. Nhập mã thật từ giao dịch thử đã xác minh > xác nhận > gọi PATCH đúng một lần > lịch chuyển đã thanh toán và có log audit.
5. Tài khoản Customer và Staff không thấy sổ thu tiền; gửi API trực tiếp phải được backend từ chối.
6. Không có lịch thì hiển thị trạng thái trống rõ ràng.
7. Test ở 375px và desktop, không bị tràn hàng/cắt nút.
8. Trả về lỗi mạng/500 không được báo đã thanh toán. Kiểm tra API và DB bằng môi trường riêng.

## Chưa hoàn thiện
- Không tự động đối soát ngân hàng, không phải chứng từ thanh toán hay hóa đơn.
- Chưa có báo cáo tài chính theo kỳ và kiểm thử end-to-end trên PostgreSQL máy người dùng.

## Tham khảo UX
- MoeGo Grooming Calendar: quản lý lịch, ca làm, khung giờ ngay trong khu điều hành.
- Gingr Appointment Cards: thông tin cần thiết ở cùng một thẻ nghiệp vụ.

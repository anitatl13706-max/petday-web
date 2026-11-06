# PetDay V6.17 — Quản lý trường hợp không đến và đặt lại dịch vụ

## Mục tiêu
- Không thêm menu. Admin xử lý trong Chi tiết lịch; khách thao tác trong Lịch hẹn của tôi.
- Tham khảo thiết kế agenda/calendar và no-show / book again từ MoeGo Help Center. Không sao chép giao diện hoặc tài sản.
- Không tự thu phí, hoàn tiền hoặc xác minh thanh toán giả.

## Khách không đến (no-show)
1. Chỉ Admin và lịch `Đã xác nhận`, `Chưa thanh toán`.
2. Chỉ sau thời gian hẹn ít nhất 30 phút theo giờ Việt Nam, và chưa có bất kỳ sự kiện chăm sóc nào.
3. Admin phải ghi lý do (8–500 ký tự), xác nhận lại.
4. Transaction: khóa dòng booking, ghi `booking_no_shows`, giải phóng nhân viên, chuyển trạng thái `Đã hủy`, tạo thông báo khách.
5. Cấm báo không đến cho lịch đã thanh toán hoặc đã check-in; không xóa dữ liệu lịch sử.
6. Sau ghi nhận, khách đọc lý do và có thể gửi tư vấn khi cần. Cơ chế tranh chấp riêng chưa được triển khai.

## Đặt lại lịch
- Chỉ khách đặt lại từ lịch `Hoàn tất` hoặc `Đã hủy`.
- Chỉ sao chép hồ sơ thú cưng, dịch vụ chính, chi nhánh; ngày đặt lại mặc định tương lai.
- Không sao chép trạng thái cũ, thanh toán, mã giảm giá, báo giá cũ; phải qua kiểm tra còn chỗ và thanh toán mới.

## Migration
- Sao lưu database petday. Đảm bảo 001–013 có hiệu lực trước khi chạy `database/014_v617_no_show.sql`.
- Migration tạo một bảng + index; không xóa/cập nhật lịch cũ.
- Có thể chạy lại DDL idempotent; không chạy lại toàn bộ migration cũ một cách tùy tiện.

## Kiểm thử cần làm trên máy có PostgreSQL
1. Xác thực `/api/health/schema` trả `schemaReady:true`.
2. Admin xác nhận lịch còn tương lai: no-show trả HTTP 409.
3. Admin xác nhận lịch đã quá 30 phút, chưa thanh toán, chưa check-in: ghi no-show và có thông báo; trạng thái chuyển Đã hủy.
4. Lặp lại no-show: HTTP 409; không tạo hai bản ghi.
5. Lịch đã thanh toán hoặc đã check-in: HTTP 409.
6. Customer không thể POST endpoint admin: HTTP 403.
7. Customer xem lý do, chọn Đặt lại dịch vụ; hệ thống kiểm tra ngày/giờ/chỗ và giá mới.
8. Đăng nhập Admin/Customer; theo dõi SQL `booking_no_shows` và `account_notifications`.

## Những phần chưa triển khai
Đăng nhập nhân viên riêng, auto reminder delivery, quản lý hủy có hoàn phí, ảnh báo cáo chăm sóc, Pet Taxi, đối soát chuyển khoản tự động, test end-to-end trên database của bé.

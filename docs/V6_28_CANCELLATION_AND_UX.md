# PetDay V6.28 — Yêu cầu hủy lịch đã xác nhận

## Nghiệp vụ
Khách có thể tự hủy khi lịch còn `Đang chờ xác nhận` (nghiệp vụ hiện có). Với lịch `Đã xác nhận` và ngày phục vụ còn ở tương lai, khách nhập lý do và gửi yêu cầu cho Admin. Lịch **không bị hủy** ngay khi khách gửi yêu cầu. Admin phê duyệt hoặc từ chối, có lý do, một lần trên mỗi yêu cầu. Nếu duyệt: đóng lịch, giải phóng nhân viên, hủy điều phối Pet Taxi, từ chối yêu cầu đổi lịch đang chờ, tạo thông báo cho khách; nếu đã thu tiền thì không tự hoàn tiền, phải dùng quy trình hoàn tiền riêng.

## Nâng cấp
Sao lưu PostgreSQL `petday`. Chỉ sau khi đã có SQL 001–019, chạy `database/020_v628_cancellation_review.sql` trong pgAdmin. Không chạy lại SQL cũ; không xóa dữ liệu hiện tại. Copy server/.env của bản đang hoạt động.

## Kiểm thử UAT
1. Customer tạo lịch, Admin xác nhận, Customer gửi yêu cầu hủy với lý do >=10 ký tự → `pending`.
2. Customer gửi lại khi pending → HTTP 409.
3. Admin duyệt, nhập ghi chú >=8 ký tự → lịch hủy, khách nhận thông báo; nhân viên được giải phóng; khoản đã thu giữ trạng thái để xử lý hoàn riêng.
4. Admin xử lý lại cùng yêu cầu → HTTP 409.
5. Admin từ chối → lịch vẫn đã xác nhận; khách nhận phản hồi.
6. Không được gửi yêu cầu cho lịch đã bắt đầu, đã hủy hoặc lịch ngày hôm nay.
7. Customer khác không thể gửi yêu cầu hủy lịch người khác.
8. Staff không thể đọc danh sách yêu cầu hoặc duyệt.
9. Kiểm tra tab Admin `Lịch & điều phối` và tab Customer `Lịch hẹn` trên mobile.
10. Kiểm tra tiền đã thu không bị xóa hoặc đổi sang chưa thanh toán sau duyệt hủy.

## Giới hạn
Chưa hỗ trợ tự động hoàn tiền hoặc gọi API ngân hàng; chưa có bộ test tích hợp với PostgreSQL trên máy người dùng.

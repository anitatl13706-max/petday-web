# PetDay V6.26 – lịch nhắc tự động và phiếu hẹn

## Thay đổi chính
1. Nhắc lịch in-app theo ngày mai được tổ chức thành hàm dùng chung cho nút Admin và bộ kiểm tra tự động. Transaction, advisory lock và ràng buộc UNIQUE giữ không tạo trùng. Mặc định không chạy tự động.
2. Bật `PETDAY_AUTO_REMINDERS=true` trong `server/.env`, khởi động lại API. Backend chạy kiểm tra lúc khởi động và mỗi 60 phút. Cần luôn bật server để nhắc lịch hoạt động. Nội dung lưu trong `account_notifications` và `booking_reminders`; không gửi email/SMS/Push. Người dùng xem trong Tài khoản → Thông báo.
3. Khách xem lịch hẹn có thể bấm **In phiếu hẹn** để xem và in hoặc lưu PDF bằng trình duyệt. Phiếu chứa mã lịch, thú cưng, dịch vụ, giờ/chi nhánh, trạng thái và tiền dự kiến; không phải hóa đơn/biên lai. Không sử dụng dịch vụ PDF bên ngoài hoặc gửi dữ liệu ra ngoài.
4. Không thêm bảng và **không cần migration SQL mới**. Yêu cầu các migration trước đến 019 đã chạy.

## Kiểm thử thủ công
- Admin xác nhận một lịch vào ngày mai; bật tự động, khởi động backend, xác nhận đúng 1 thông báo; khởi động lại không có thông báo lặp.
- Lịch chưa xác nhận/đã hủy/ngày khác: không tạo nhắc lịch.
- Gửi nhắc lịch thủ công cùng thời điểm bộ tự động: DB không bị trùng.
- Khách chỉ thấy thông báo trong tài khoản của mình.
- Khách in phiếu hẹn và lưu PDF bằng Chrome; các phần website khác không xuất hiện trên bản in.
- Không có Admin trong database: scheduler bỏ qua, ghi log; không tạo người dùng giả.
- Tắt `PETDAY_AUTO_REMINDERS` (hoặc đặt false) và khởi động lại: chỉ nhắc lịch thủ công.

## Chú ý
- Backend chỉ chạy khi cửa sổ Node đang mở, đây không phải dịch vụ gửi nhắc lịch trên cloud.
- SQL 015 yêu cầu `booking_reminders.sent_by` là một user admin hợp lệ. Không thay cấu trúc.
- Để triển khai production, cần job runner/cron, giám sát và hệ thống email/SMS thực tế.
- Chưa kiểm chứng tích hợp với PostgreSQL trên máy khách hoặc full production frontend build; cần thử trên localhost.

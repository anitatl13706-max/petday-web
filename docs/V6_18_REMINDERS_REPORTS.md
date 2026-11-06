# PetDay V6.18 – Nhắc lịch & báo cáo chăm sóc bằng ảnh

## Luồng A: Nhắc lịch có kiểm soát
1. Admin mở **Nhắc lịch ngày mai** và nhấn kiểm tra.
2. Server tính ngày kế tiếp theo giờ Việt Nam, chỉ lấy lịch **Đã xác nhận**.
3. Admin gửi thông báo vào **Hỗ trợ & thông báo** của khách. Mỗi booking chỉ gửi tối đa 1 lần (UNIQUE trong PostgreSQL và advisory lock).
4. Nếu lịch bị hủy trước thao tác gửi, truy vấn lại trên server sẽ loại khỏi danh sách.
5. Không gửi SMS/email hoặc chạy tự động nền; không được quảng cáo là đã gửi tin nhắn ngoài app.

## Luồng B: Ảnh báo cáo thực tế
1. Admin mở chi tiết lịch đã xác nhận / đang thực hiện.
2. Nhập ghi chú, tùy chọn tải JPG/PNG/WebP tối đa 2MB.
3. Chọn check-in / care update / ready / checkout theo thứ tự.
4. Chỉ sau khi server chấp nhận mốc, ảnh mới được ghi vào service_events.photo_url.
5. Khách chỉ xem ảnh và timeline cho booking của chính mình.

## Nâng cấp
Backup trước. Chỉ chạy `database/015_v618_reminders_reports.sql` trên database đã đủ SQL 001–014. SQL không xóa lịch/tài khoản.

## Kiểm thử bắt buộc
- Admin không thấy lịch chưa xác nhận trong preview.
- Gửi hai lần không trùng thông báo.
- Sau đổi/hủy lịch trước khi gửi, lịch không còn xuất hiện nếu không còn thuộc ngày mai / trạng thái phù hợp.
- Customer không thể gọi endpoint nhắc lịch của Admin.
- Upload tệp khác ảnh hoặc lớn hơn 2MB bị từ chối.
- Không cho hoàn tất dịch vụ khi thiếu check-in/care_update/ready.
- Customer A không xem được timeline của customer B.
- Backend paymentStatus giữ nguyên sau checkout.
- Test build front-end và API với PostgreSQL trên máy thật trước khi báo hoàn tất.

# PetDay V6_73 — Ghi nhận khách không đến theo thao tác Admin

- Admin có thể ghi nhận **Khách không đến** ngay sau khi lịch được **Đã xác nhận**, kể cả trước giờ hẹn. Đây là quyết định thủ công và **không phải bằng chứng khách đã thực sự vắng mặt**; cần xác minh trước khi đóng lịch.
- Bắt buộc nhập lý do >= 8 ký tự và xác nhận hành động. API xác thực quyền Admin, khóa bản ghi lịch khi cập nhật, ghi người thao tác + lý do, chuyển trạng thái **Đã hủy** và thông báo Customer.
- Không thể ghi nhận nếu lịch chưa được duyệt, đã hủy/hoàn tất, đã có mốc chăm sóc hoặc Pet Taxi đã bàn giao tại cơ sở.
- Không sửa payment_status, không tự hoàn tiền; lịch đã thanh toán phải được đối soát thủ công theo chính sách.
- Nếu có yêu cầu hủy lịch của Customer đang chờ, hệ thống đóng yêu cầu đó như đã xử lý để tránh Admin duyệt yêu cầu cho lịch đã hủy (HTTP 409).

## Kiểm thử
1. Lịch đã xác nhận cho 2 ngày sau, chưa check-in, không có Taxi hoàn tất: Admin ghi lý do >=8 ký tự -> Đã hủy, hiển thị lý do và Customer nhận thông báo.
2. Lịch còn chờ xác nhận -> API trả HTTP 409.
3. Lịch Taxi đã bàn giao, hoặc đã bắt đầu dịch vụ -> API trả HTTP 409.
4. Gửi hai lần -> lần hai HTTP 409, không có 2 bản ghi.
5. Lịch đã thanh toán -> thanh toán không đổi, không tự động hoàn tiền.
6. Lịch có yêu cầu hủy đang chờ -> đóng lịch, không để đơn hủy chờ duyệt; tải lại danh sách.

Không yêu cầu migration mới. Không chạy lại SQL 001–039. Chưa kiểm thử tích hợp với PostgreSQL trên máy người dùng.

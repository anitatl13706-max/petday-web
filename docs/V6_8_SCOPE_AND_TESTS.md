# PetDay V6.8 — điều hướng và nghiệp vụ

## Hoàn thành ở mã giao diện
- Phân biệt menu Hồ sơ cá nhân, Thú cưng, Cài đặt, Thông báo, Lịch hẹn, Thanh toán, Đánh giá, Hộp thư tư vấn.
- Thông báo chỉ tổng hợp trạng thái từ bookings và consultations; chưa phải thông báo đẩy.
- Đánh giá chỉ khả dụng sau lịch hoàn tất; việc gửi và xác minh quyền vẫn do backend thực hiện.
- Hộp thư tư vấn (trong tài khoản) hiển thị phản hồi; widget Nhân viên tư vấn là form gửi, không phải hai hệ thống tách biệt.

## Luồng cần làm tiếp, chưa triển khai
- Ưu đãi: Admin tạo chiến dịch (code, thời gian, số lượt, điều kiện dịch vụ, mức tối đa) → Customer áp mã → backend kiểm tra đồng thời quota và điều kiện → giá chốt khi đặt lịch → hoàn lại quota khi hủy theo quy tắc. Không trừ bằng UI đơn thuần.
- Chuyển khoản: Admin cấu hình tài khoản nhận thật; tạo tham chiếu duy nhất cho booking; tạo QR VietQR từ dữ liệu hợp lệ; tiếp nhận biên lai; đối soát ngân hàng và ghi audit; từ chối có lý do; hoàn tiền có phiếu duyệt.
- SMTP reset: cấu hình SMTP; token băm một lần, hết hạn; phản hồi chung khi email không tồn tại; giới hạn yêu cầu; kiểm thử gửi mail.
- Nhắc lịch: queue nền theo mốc, idempotency, trạng thái gửi/nhận; tránh gửi cho lịch hủy.
- Dịch vụ: cấu hình bảng giá và loại pet/cân nặng/độ tuổi; đặt lịch sau khi backend tái tính giá; add-on, Pet Taxi, sản phẩm kèm có tồn kho và fee.
- Tư vấn: nâng cấp phiếu yêu cầu thành thread nhiều tin nhắn và phân công nhân viên trước khi gọi đó là chat trực tuyến.

## Kiểm tra thủ công
1. Đăng nhập Customer; mỗi menu phải cuộn đến phân hệ tương ứng.
2. Hồ sơ/cài đặt: thấy hướng dẫn đổi mật khẩu và hạn chế đổi email.
3. Thông báo: hiển thị số lịch và phản hồi đã lưu; không bịa notification.
4. Thanh toán tách khỏi đánh giá, thông tin lấy từ các lịch.
5. Admin vẫn thấy menu riêng; không lẫn Customer.
6. Kiểm tra máy chủ, không thay .env hoặc chạy lại SQL nếu chưa cần.

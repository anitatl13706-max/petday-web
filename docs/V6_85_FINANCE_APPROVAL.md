# V6.85: Xác nhận chuyển khoản trực tiếp ở Admin → Tài chính

- Khu **Chờ xác nhận chuyển khoản** cho phép kiểm tra và ghi nhận ngay trên thẻ thông báo của khách.
- Backend ghi payment_events và thông báo khách bằng API sẵn có; chống dùng lại cùng mã tham chiếu ở các lịch khác nhau.
- Ở chế độ PETDAY_DEMO_PAYMENT=true, API dùng mã tham chiếu riêng TEST-<mã lịch>; đây chỉ là mô phỏng, không phải giao dịch ngân hàng.
- Khi chạy thực, Admin phải nhập mã giao dịch thực nhận từ sao kê; không tin mã do khách cung cấp.
- Lịch chuyển khoản chưa ghi nhận thanh toán sẽ bị chặn duyệt và chặn check-in từ Backend. Lịch tiền mặt không thay đổi.
- Không có migration SQL mới. Cần các migration trước đó (nhất là 043) đã được áp dụng trong database TEST.
- Nếu có các lịch đã xác nhận từ bản cũ nhưng chưa thanh toán, Backend chặn bắt đầu dịch vụ cho đến khi được đối soát.

## Kiểm thử
1. Customer tạo lịch chuyển khoản, gửi ngân hàng và tên người chuyển.
2. Admin → Tài chính thấy đúng lịch trong Chờ xác nhận chuyển khoản.
3. Chưa xác nhận tiền, bấm duyệt lịch → HTTP 409.
4. Admin xác nhận, lịch mất khỏi hàng đợi; nhật ký lưu, phía khách thấy Đã thanh toán.
5. Duyệt lịch được sau khi đã thanh toán; không thể xác nhận tiền lần hai.
6. Lịch tiền mặt vẫn duyệt được bình thường.
7. Với thanh toán thử nghiệm, không gửi tiền thật.

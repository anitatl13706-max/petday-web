# PetDay V6.13 — Khôi phục tài khoản và hai phương thức thanh toán

## Điểm mới

1. **Quên mật khẩu**: giao diện giải thích 3 bước, gửi hướng dẫn qua SMTP; liên kết một lần, hết hạn 30 phút; màn hình tạo mật khẩu có xác nhận lần hai. Khi truy cập liên kết reset, form reset luôn được hiển thị ngay cả khi trong trình duyệt còn phiên đăng nhập cũ.
2. **Đổi mật khẩu khi đang đăng nhập**: trong phần Cài đặt tài khoản, nhập mật khẩu hiện tại, mật khẩu mới, xác nhận lại; backend đối chiếu mật khẩu băm bằng bcrypt. Không cần email SMTP ở luồng này.
3. **Đặt lịch**: hiển thị **cả hai** radio Tiền mặt/Chuyển khoản. Nếu chưa thiết lập ngân hàng, radio chuyển khoản vẫn nhìn thấy và chọn được để đọc thông báo, nhưng **không thể gửi booking bằng chuyển khoản** tới khi cấu hình hợp lệ. Không tạo QR giả hoặc xác nhận thanh toán giả.
4. **Admin → Thiết lập nhận chuyển khoản**: lưu ngân hàng, số tài khoản, chủ tài khoản vào PostgreSQL. Endpoint có xác thực admin, thông tin dùng để hướng dẫn chuyển khoản theo mã lịch.
5. **Khách → Thanh toán của tôi**: có thể đổi phương thức của lịch **chưa thanh toán**, chưa hủy/hoàn tất. API tự kiểm tra ownership, trạng thái và tạo thông báo; không thay đổi giá đơn hàng.
6. **Admin đối soát**: tiếp tục dùng tính năng của V6.12, chuyển khoản yêu cầu mã tham chiếu trước khi đánh dấu đã nhận tiền. Không có xác minh ngân hàng tự động.

## Nâng cấp database an toàn

- Sao lưu database `petday` trước khi cập nhật.
- Đảm bảo các migration trước đó (đặc biệt `009_v612_safe_upgrade.sql`) đã được áp dụng thành công. Nếu `/api/health/schema` V6.12 còn báo thiếu, phải kiểm tra và giải quyết tình trạng đó trước khi chuyển bản mới.
- Trong pgAdmin kết nối đúng database `petday`, chạy file **`database/010_v613_payment_settings.sql`** đúng một lần. File chỉ tạo bảng mới `business_payment_settings` nếu chưa có. Không xóa dữ liệu cũ.
- Khởi động V6.13 frontend/backend, kiểm tra `http://localhost:4000/api/health/schema` báo `schemaReady: true`.

## Cấu hình quên mật khẩu SMTP

Sao chép `.env` đang chạy được từ backend V6.12 sang `PETDAY_OFFICIAL/server/.env` ở V6.13. Không đính kèm hoặc chia sẻ `.env` công khai. Những biến cần cấu hình từ nhà cung cấp email:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-real-sending-account
SMTP_PASS=your-provider-app-password
SMTP_FROM=PetDay <your-real-sending-account>
RESET_BASE_URL=http://localhost:8443/
```

Không chạy chức năng khôi phục email khi chưa có SMTP; API phản hồi 503 với thông báo rõ. Với máy demo không cấu hình SMTP, tài khoản đang đăng nhập vẫn đổi mật khẩu được qua Cài đặt.

## Kịch bản kiểm thử chính

- Khách chọn **Tiền mặt**, đặt lịch; Admin nhìn thấy lịch và ghi nhận thanh toán sau khi thu.
- Khách chọn **Chuyển khoản** khi chưa có ngân hàng: radio chọn được, không tạo được lịch sai thông tin.
- Admin cấu hình ngân hàng thật, làm mới trang; khách tạo lịch bằng chuyển khoản; hướng dẫn hiện **mã lịch** trong nội dung chuyển tiền; trạng thái vẫn `Chưa thanh toán`.
- Khách đổi phương thức trên lịch chưa thanh toán; DB cập nhật; thông báo được lưu; sau khi Admin xác nhận thanh toán khách không thể tự đổi nữa.
- Khách nhấn Quên mật khẩu: khi SMTP đã cấu hình, email chứa link 30 phút; link hết hạn và token đã dùng không thể dùng lại.
- Khách đang đăng nhập đổi mật khẩu bằng mật khẩu hiện tại; kiểm tra đăng nhập lại bằng mật khẩu mới.
- Người không phải Admin không thể gọi `PUT /api/admin/payment-settings`; người khác không thể đổi phương thức lịch không thuộc tài khoản.

## Giới hạn cần ghi đúng trong báo cáo

V6.13 chưa tích hợp VietQR tự động, chưa nhận webhook ngân hàng, chưa tích hợp VNPAY Sandbox và chưa có dịch vụ gửi email mặc định. Ngoài unit test backend và kiểm tra cú pháp, build frontend & kiểm thử end-to-end phải được thực hiện trên máy có dependencies và PostgreSQL.

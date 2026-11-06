# PetDay V6.40 — Quy trình chuyển khoản và khôi phục mật khẩu

## Nâng cấp không mất dữ liệu
1. Sao lưu toàn bộ database `petday` bằng pgAdmin (Custom format).
2. Kiểm tra PostgreSQL đã áp dụng SQL 001–022 từ các bản trước (không chạy lại).
3. Chạy **chỉ** `database/023_v640_transfer_notices.sql` trong Query Tool.
4. Sao chép `.env` đang hoạt động từ server V6.39 sang server V6.40. Không gửi `.env` cho người khác, không commit lên Git.
5. Khởi động lại backend và frontend, chạy `/api/health/schema` và `/api/payment/options`.

## Cấu hình ngân hàng
Trong Admin → Tài chính → Thiết lập ngân hàng, nhập tên ngân hàng, số tài khoản 6–25 chữ số và chủ tài khoản thật. Sau khi LƯU, GET `/api/payment/options` phải trả `bankTransfer.enabled = true`. Không nên dùng tài khoản không được phép sử dụng để thu tiền.

## Luồng khách chuyển khoản (thủ công, không có callback ngân hàng)
- Khách chọn chuyển khoản khi đặt lịch hoặc đổi cách trả tiền trong “Thanh toán của tôi” trước khi thu.
- Hệ thống hiển thị số tài khoản, chủ tài khoản, ngân hàng, nội dung là **mã lịch** và số tiền chính xác. Khách tự chuyển qua ứng dụng ngân hàng. Không dùng một ảnh QR giả; chưa kết nối VietQR/Thanh toán tự động.
- Khách có thể nhấn “Tôi đã chuyển khoản”, nhập mã tham khảo nếu có (không bắt buộc); backend lưu **thông báo**, KHÔNG cập nhật `payment_status`.
- Admin thấy thông báo, kiểm tra **sao kê thực nhận**: tài khoản nhận, số tiền, mã lịch/nội dung và mã giao dịch thật. Sau đó ghi mã giao dịch thật trong Sổ thu tiền. Backend yêu cầu mã giao dịch khi ghi nhận chuyển khoản, lưu nhật ký và không cho xác nhận lặp.
- Nếu không có tiền trong sao kê: KHÔNG xác nhận đã thu; liên hệ khách, giải quyết sai số bằng quy trình phù hợp.

## Vì sao Admin bắt buộc nhập mã giao dịch?
Đó là **mã giao dịch có thật từ sao kê/tài khoản ngân hàng của bên nhận**, phục vụ kiểm toán và chống ghi nhận trùng bằng mắt; không phải mã bí mật, không phải mã khách tự sinh. Khi khách không biết mã này, khách vẫn có thể báo đã chuyển mà không cung cấp mã.

## Cấu hình quên mật khẩu
Cần SMTP thật. Copy `server/.env.example` làm mẫu nhưng KHÔNG ghi đè `.env` hiện tại. Với Gmail, bật xác minh 2 bước và tạo App Password (nếu tài khoản đủ điều kiện); điền `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` (App Password), `SMTP_FROM`, và `RESET_BASE_URL=http://localhost:8443/?reset=1#tai-khoan`. Giữ riêng `DATABASE_URL` và `JWT_SECRET` đang hoạt động. Khởi động lại backend; vào `/api/health/features` xem khả năng khôi phục. Test bằng hộp thư do chính mình sở hữu. Mã reset hết hạn 30 phút, dùng một lần và KHÔNG hiển thị ở trang khách. Không thể bật gửi email thật khi chưa có tài khoản và mật khẩu SMTP hợp lệ.

## Test hồi quy
1. Đặt lịch trả tiền mặt thành công, trạng thái chưa thu.
2. Cấu hình ngân hàng trong Admin; `/api/payment/options` báo enabled.
3. Tạo lịch chuyển khoản; Customer xem đúng thông tin ngân hàng và tổng tiền.
4. Customer gửi “Tôi đã chuyển khoản”; vẫn là “Chưa thanh toán”.
5. Admin thấy thông báo; kiểm tra sao kê ngoài hệ thống; xác nhận với mã ngân hàng thật; PaymentStatus mới chuyển sang “Đã thanh toán”.
6. Gửi lần nữa/tự xác nhận lần nữa không sinh thêm khoản thu.
7. Không được thông báo chuyển khoản cho lịch tiền mặt hoặc đã hủy.
8. Quên mật khẩu: chưa cấu hình báo đúng lỗi, có SMTP thì gửi link tới inbox, link dùng một lần và hết hạn.

## Giới hạn
Không có giao dịch ngân hàng/SMTP tự động trong môi trường của người phát triển. Mọi thao tác phải kiểm thử tích hợp trên máy có PostgreSQL và SMTP được cấu hình.

# PETDAY_OFFICIAL — bản tích hợp tiếp nối v5

## Đã triển khai ở mức mã nguồn (chưa xác nhận E2E trên máy người dùng)
- Điều hướng tài khoản Admin tập trung vào quản trị; Customer dùng hồ sơ/đặt lịch. Backend xác minh lại vai trò từ database ở mỗi API được bảo vệ.
- Yêu cầu tư vấn được gắn với tài khoản đã đăng nhập; Admin soạn phản hồi và đóng phiếu; khách xem phản hồi tại **Tài khoản**. Không phải chat trực tuyến hay email tự gửi.
- Booking lựa chọn **Tiền mặt** hoặc **Chuyển khoản** và lưu `payment_method` trong PostgreSQL. Admin xác nhận đã nhận tiền thủ công; không tự xác nhận thanh toán online.
- Quên mật khẩu có luồng yêu cầu email và link một lần 30 phút, mã hash trong database, xác thực/mật khẩu băm. Cần cấu hình SMTP hợp lệ để chức năng hoạt động; nếu chưa có, API báo rõ chưa được cấu hình. Không có chế độ hiển thị token trên màn hình.
- Mục Tài khoản khách có danh sách phiếu tư vấn và câu trả lời.

## Cập nhật tại thư mục gốc hiện dùng — KHÔNG cần tạo database khác
1. Sao lưu database `petday` bằng pgAdmin Backup trước khi migration. Chạy `database/004_official_workflows.sql` trên database `petday` (chỉ sau khi đã có migration v4). Không chạy lại file 001/002/003.
2. **Để tránh giải nén dự án lồng nhau**, nếu dùng bản ZIP này thay thư mục chính cũ thì chép `server/.env` của v5 sang `server/.env` của thư mục mới. Không đưa `.env` lên Git, chat hoặc file báo cáo.
3. Mở terminal ở **thư mục có `package.json`**, chạy `npm install`. Tại thư mục `server` chạy `npm install` (có bổ sung `nodemailer`).
4. Tắt các backend/frontend cũ chiếm port; chỉ giữ server `4000` và frontend `8444` (hoặc theo thông báo Vite). Backend: `cd server; npm run dev`. Frontend từ thư mục gốc: `npm run dev -- --port 8444`.
5. Mở `http://localhost:4000/api/health` và xác minh `{"ok":true,"mode":"postgresql"}`; đăng nhập bằng tài khoản test; kiểm tra đặt lịch, phiếu hỗ trợ, vai trò admin.

## Quên mật khẩu qua email
Để thực sự gửi liên kết cần bổ sung thông tin SMTP của **tài khoản gửi email thử nghiệm hợp lệ**, trong `.env` của server:

```dotenv
SMTP_HOST=<máy chủ SMTP>
SMTP_PORT=587
SMTP_USER=<tài khoản SMTP>
SMTP_PASS=<mật khẩu ứng dụng/token SMTP>
SMTP_FROM=<địa chỉ email người gửi>
RESET_BASE_URL=http://localhost:8444/
```

**Quan trọng**: `RESET_BASE_URL` hiện phải là URL không chứa phần hash; ví dụ `http://localhost:8444/?reset=1`, và liên kết reset phải mở giao diện tài khoản. Dùng `RESET_BASE_URL=http://localhost:8444/` khi chạy localhost và link sẽ có `?reset_token=...`; người dùng vào trang tài khoản để hiện form reset. Không dùng localhost trong email gửi cho người khác trên thiết bị khác. Nếu chưa thiết lập SMTP, chức năng trả 503 thay vì giả báo đã gửi email.

## Giới hạn quan trọng trước khi bảo vệ
- Chưa có xác nhận E2E hoặc frontend build thành công trong môi trường soạn mã. Cần kiểm thử local trên máy người dùng.
- Chuyển khoản là **lựa chọn phương thức + xác minh thủ công**; chưa có tài khoản ngân hàng thật, QR động, đối soát hoặc callback cổng thanh toán. Không giả lập đã thanh toán.
- Các module chỉnh giá và chi nhánh trong Admin demo cũ chưa liên thông với dữ liệu API; không nên trình bày đó là tính năng quản trị thật.
- Chưa có lịch nhân viên, đổi lịch, hoàn tiền thực tế, Pet Taxi, khuyến mãi và add-on đồng bộ backend. Các tính năng này cần đặc tả/migration/API + kiểm thử riêng.
- Trang trợ lý tự động hiện vẫn là chatbot kịch bản, không phải AI tạo sinh.

## Test nhanh
1. Đăng nhập tài khoản Admin; dropdown chỉ có Trung tâm quản trị/Đăng xuất; vào Quản trị.
2. Đăng nhập tài khoản Customer; Tài khoản có thú cưng, lịch hẹn và phiếu tư vấn.
3. Đặt lịch: chọn Tiền mặt/Chuyển khoản; xác nhận; xem `payment_method` trong database; trạng thái ban đầu phải Chưa thanh toán.
4. Admin đánh dấu thanh toán sau khi xác minh, khách refresh kiểm tra trạng thái.
5. Customer đăng nhập gửi yêu cầu nhân viên, Admin nhập phản hồi và đóng phiếu, Customer refresh tài khoản thấy câu trả lời.
6. Với SMTP đã cấu hình, thử quên mật khẩu qua email; xác nhận link hết hạn/đã dùng không sử dụng lại được.

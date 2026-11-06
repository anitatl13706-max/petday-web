# PetDay – Kiểm toán và cấu hình để khép kín các luồng

## Những gì đã xác minh từ source V6.2
- `/api/auth/forgot-password` và `/api/auth/reset-password` đã có backend Nodemailer, token SHA-256 và thời hạn 30 phút, nhưng **cần SMTP**. Bảng `password_reset_tokens` thuộc migration 004.
- `/api/pets/photo` đã nhận raw JPG/PNG/WebP đến 2MB; phải đăng nhập và sau khi upload phải `PUT /api/pets/:id` với `photoUrl` trả về. Server phục vụ `/uploads/`.
- `calculate()` ở `server/src/rules.js` tính theo cân nặng: <=5kg 0đ; (5,10] +50.000đ; (10,20] +100.000đ; >20 +160.000đ. Daycare không phụ phí cân nặng; Daycare chỉ cho chó và tối đa 30kg. **Đây là quy tắc demo, cần chuyển sang bảng giá Admin cấu hình để sản phẩm thật.**
- Booking chấp nhận `cash` hoặc `bank_transfer`, nhưng chưa có cổng thanh toán, QR, webhook hoặc bảng đối soát đầy đủ. Trạng thái `Đã thanh toán` hiện do Admin đổi thủ công; KHÔNG phải xác nhận từ ngân hàng.

## 1. Email quên mật khẩu
Từ `server/.env.example`, thêm vào `server/.env` đang dùng các biến `RESET_BASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. **Giữ nguyên** DATABASE_URL và JWT_SECRET đang hoạt động. Dùng Gmail App Password nếu tài khoản đủ điều kiện; không dùng mật khẩu Gmail thường. `RESET_BASE_URL` khớp địa chỉ frontend mà Vite thực sự hiển thị (8443, 8444 hay cổng khác).

Lưu `.env`, khởi động lại backend. Chạy `SELECT to_regclass('public.password_reset_tokens');` để xác nhận migration 004 đã có. Kiểm thử: yêu cầu email đã đăng ký -> nhận email -> mở URL token -> đặt mật khẩu mới -> token cũ không dùng lại được. Email không tồn tại nhận thông báo chung; kiểm tra rate-limit và error logs. Không thử bằng Gmail thật khi chưa kiểm tra bảo mật email.

## 2. Ảnh Pet Profile
Trong DevTools/Network kiểm tra `POST /api/pets/photo` status **201** và JSON `url`, ví dụ `/uploads/<uuid>.jpg`; sau đó PUT `/api/pets/:id` phải 200. Ảnh không hiển thị: mở trực tiếp `http://localhost:4000/uploads/<uuid>.jpg` để xem file đã phục vụ chưa. Nếu frontend chạy cổng 8443 thì URL tương đối `/uploads/` phải được proxy Vite chuyển tiếp đúng tới cổng 4000; thiếu proxy sẽ trả HTML/404. Kiểm tra `vite.config.ts`.

SQL chỉ đọc: `SELECT id,name,photo_url FROM public.pets WHERE name='Bông';`. Nếu `photo_url` trống thì ảnh chưa được gắn với hồ sơ. Không chạy câu lệnh INSERT/ALTER tùy tiện hoặc tạo cột `image_url`: schema hiện tại dùng `photo_url`.

## 3. Thanh toán (quyết định nghiệp vụ)
**Phương án được khuyên cho đồ án:** tiền mặt tại cửa hàng + VNPAY **Sandbox** (thanh toán mô phỏng có callback/IPN đúng). Nếu chưa đăng ký được merchant sandbox, chọn tiền mặt + chuyển khoản **đối soát thủ công** nhưng ghi đầy đủ chứng từ, mốc thời gian, trạng thái, nhân viên xác minh.

Thanh toán online cần: tạo `payment_attempt` PENDING, liên kết booking và số tiền tính SERVER-SIDE; điều hướng VNPAY; kiểm chữ ký callback/IPN, kiểm `amount`, `txnRef`, merchant, mã giao dịch, chống cập nhật lặp; chuyển sang PAID sau **IPN hợp lệ**; Return URL chỉ là UI, không tự đánh dấu đã trả tiền. Xử lý FAILED/EXPIRED/CANCELLED và REFUND theo chính sách. URL IPN phải truy cập từ internet qua HTTPS, localhost không nhận callback trực tiếp.

VietQR tĩnh/động chỉ mã hóa thông tin chuyển khoản, **không chứng minh ngân hàng đã nhận tiền**. Không công khai QR hoặc số tài khoản mẫu như tài khoản thu thật. Nếu bật QR, cần thông tin nhận tiền thật được quản trị xác minh và trạng thái `AWAITING_VERIFICATION` cho đến khi được đối soát.

Tối thiểu trạng thái thanh toán tách khỏi trạng thái lịch: UNPAID, AWAITING_PAYMENT, AWAITING_VERIFICATION, PAID, FAILED, REFUND_PENDING, REFUNDED. Không cho Admin ghi 'Đã thanh toán' khi thiếu chứng cứ với chuyển khoản.

## 4. UI/UX đích
Customer account: Tổng quan, Thông tin cá nhân, Thú cưng, Lịch hẹn, Thanh toán, Lịch sử chăm sóc, Yêu cầu tư vấn, Đánh giá, Cài đặt bảo mật, Đăng xuất. Admin có shell riêng với Dashboard, Booking, Dịch vụ, Giá & Phụ phí, Khung giờ/công suất, Khách hàng, Đối soát, Yêu cầu tư vấn, Đánh giá, Nhật ký; không trộn luồng customer.

Bước 2 chọn dịch vụ nên hiện: giá cơ bản + mức phụ phí cân nặng thực tế + gói phụ trợ; ghi 'Giá dự kiến' khi chưa chốt; sau API tạo booking thành công phải lưu snapshot các line items và 'Tổng tiền đặt lịch' để tránh thay giá sau này.

## 5. Điều còn thiếu và chưa triển khai trong patch này
API quản trị bảng giá, sản phẩm/add-on, Pet Taxi, lưu chứng từ, VNPAY IPN + callback, email nhắc lịch và chatbot kết nối dữ liệu thực vẫn phải được viết và kiểm thử end-to-end. Bản này KHÔNG tuyên bố các luồng trên đã chạy hoàn chỉnh.

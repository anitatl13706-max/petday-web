# PetDay V6.12 — Hướng dẫn nâng cấp an toàn

## Nguyên nhân đã xác nhận từ ảnh
- `/api/health` = OK; đăng nhập đã xác thực; `/api/bookings` = HTTP 503.
- Trong source V6.11, 503 từ `/bookings` ứng với SQL `42703` (thiếu cột) hoặc `42P01` (thiếu bảng). Ảnh chưa cho biết chính xác tên cột/bảng.
- Bản V6.12 bổ sung nhật ký lỗi `[schema-mismatch]` trong terminal và nâng cấp schema 009.

## Nâng cấp (không mất dữ liệu)
1. Dừng backend/frontend cũ. Sao lưu database `petday` trong pgAdmin trước.
2. Giữ nguyên database, tài khoản và các bản ghi. Giải nén V6.12, copy `server/.env` từ bản đang chạy.
3. **Trong pgAdmin → database petday → Query Tool**, chạy DUY NHẤT `database/009_v612_safe_upgrade.sql`. Gói này bổ sung các thay đổi liên quan từ 007–008 mà không chạy lại bản base 001–006. Nếu đã chạy 007–008, `IF NOT EXISTS` giúp bỏ qua phần đã có. Xem lỗi và xử lý nếu migration thất bại, đừng chạy lại các bản base.
4. Chạy backend `cd server && npm install && npm run dev`; frontend `npm install && npm run dev` ở thư mục `PETDAY_OFFICIAL`.
5. Kiểm tra `http://localhost:4000/api/health` và `http://localhost:4000/api/health/schema`; mong đợi `schemaReady:true`. Nếu `schemaReady:false`, xem danh sách missing, đừng tự tạo dữ liệu giả.

## Nghiệp vụ mới
- Booking: ghi thông báo lịch vừa tạo, trạng thái sau khi nhân viên xử lý, hủy lịch.
- Admin: xác nhận thanh toán thực nhận có mã tham chiếu ngân hàng (bắt buộc với chuyển khoản), lý do khi đảo trạng thái; lưu log bất biến trong `payment_events`.
- Khách: hộp thông báo riêng có đánh dấu đã đọc.
- Admin: tạo, tắt/mở mã khuyến mãi; backend xác minh trước khi tính tiền trong transaction.
- Tiền mặt / chuyển khoản: hiển thị cả hai lựa chọn. Chuyển khoản chỉ mở khi các biến PETDAY_BANK_NAME, PETDAY_BANK_ACCOUNT, PETDAY_BANK_HOLDER có giá trị chính xác trong server/.env. Không dùng tài khoản bịa.

## Giới hạn
- Chưa tích hợp API ngân hàng, VietQR hay VNPAY IPN; xác nhận thanh toán là bằng chứng nhân viên tự ghi nhận và đối soát, không phải xác thực giao dịch tự động.
- Chưa có thông báo đẩy/email tự động; mục thông báo là dữ liệu trong PostgreSQL khi tải trang.
- Các quy trình nâng cao (Pet Taxi, cross-sell, quản lý kho) chưa được phát triển trong gói này.
- Không chia sẻ file `.env`, JWT, mật khẩu PostgreSQL, access token hoặc mã đặt lại mật khẩu.

## Test nhanh
1. Admin/Customer đăng nhập được, xem `/api/health/schema`.
2. Customer tạo Pet rồi Booking; kiểm tra lịch mới, thông báo khách.
3. Admin xác nhận lịch và kiểm tra khách thấy trạng thái mới; thử thao tác không hợp lệ phải bị chặn.
4. Admin xác nhận tiền mặt, kiểm tra lịch sử đối soát và thông báo; chuyển khoản yêu cầu mã giao dịch.
5. Admin tạo mã có hạn sử dụng, áp dụng trên booking; thử mã không hợp lệ, quá hạn hoặc hết lượt.
6. Admin trả lời yêu cầu tư vấn; khách kiểm tra phản hồi trong tài khoản.

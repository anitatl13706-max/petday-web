# PetDay V6.128 — Hướng dẫn cập nhật và kiểm thử

## Các thay đổi trong bản này

- Backend tự rà lịch hết ngày theo múi giờ Asia/Ho_Chi_Minh khi khởi động và mỗi 15 phút:
  - Đã xác nhận, không có bản ghi tiếp nhận/chăm sóc hay Taxi bàn giao -> Đã hủy, No-show; không phát sinh khoản hoàn hoặc khoản thu mới.
  - Đang thực hiện, quá ngày kết thúc phục vụ -> Hoàn tất; KHÔNG tạo biên nhận tiền mặt hay xác nhận pet đã bàn giao.
  - Daycare nhiều ngày xét `endDate` trong dòng `schedule` của đơn. Daycare cũ không có ngày kết thúc tin cậy sẽ được để nguyên để tránh đóng sớm.
  - Ghi lịch sử vào `booking_auto_close_events`, không ghi thêm `service_events` giả, xử lý idempotent.
- Giao diện khách bỏ các tab Thanh toán và Hoàn tiền riêng. Theo dõi tiền và hoàn tiền bên trong chi tiết từng lịch. QR chỉ được tải khi khách mở đúng lịch đủ điều kiện thanh toán.
- Admin bỏ menu Tài chính. Mở đối soát chuyển khoản từ Lịch hẹn, cấu hình ngân hàng và giá dịch vụ trong CSKH & ưu đãi. Giữ nguyên dữ liệu backend.
- Danh sách lịch mới đặt nhất vẫn lên đầu. Có bộ lọc Hoàn tiền, No-show (Admin), thú cưng, trạng thái.
- Loại ô số tiền trùng trong chi tiết, đơn đã hủy không hiện số dư chưa thu như công nợ.
- Trang chủ đổi thanh tìm lịch ba ô thành tìm kiếm dịch vụ/sản phẩm. Kết quả dịch vụ có thể chuyển vào đặt lịch đã chọn sẵn dịch vụ; tìm sản phẩm chuyển đến Cửa hàng kèm từ khóa.
- Banner tư vấn mở chatbot PetDay. Đã loại số hotline 1900 8668 chưa được xác thực khỏi header, banner và footer.

## Nâng cấp từ V6.127

1. Sao lưu PostgreSQL TEST (không áp dụng ngay cho database thật).
2. Nếu **chưa chạy** `database/063_v6126_reschedule_slot_compat.sql` ở V6.126/V6.127, chạy 063 trước.
3. Mở pgAdmin -> database PetDay TEST -> Query Tool. Chạy **một lần** `database/064_v6128_booking_auto_close_audit.sql` bằng F5.
4. Chép file `.env` riêng của backend từ phiên bản đang chạy tốt sang `PETDAY_OFFICIAL/server/.env` (không chia sẻ mật khẩu). Kiểm tra `DATABASE_URL` đang trỏ database TEST.
5. Dừng cả frontend và backend cũ bằng Ctrl+C. Chạy hai PowerShell:

Frontend:
```powershell
cd "$env:USERPROFILE\Downloads\PetDay_V6_128_AutoClose_IntegratedBookings_Search\PETDAY_OFFICIAL"
npm install
npm run dev
```
Backend (PowerShell khác):
```powershell
cd "$env:USERPROFILE\Downloads\PetDay_V6_128_AutoClose_IntegratedBookings_Search\PETDAY_OFFICIAL\server"
npm install
$env:PORT=4001
npm start
```
6. Mở `http://localhost:5173`.

**Lưu ý:** Khi backend V6.128 khởi động sau khi có migration 064, nó sẽ tự xử lý **cả những đơn lịch sử đang ở Đã xác nhận / Đang thực hiện đã qua ngày**, chứ không chỉ đơn mới. Hãy kiểm tra lịch sử và sao lưu trước. Có thể tạm vô hiệu bằng thêm `PETDAY_AUTO_CLOSE_ENABLED=false` vào file `server/.env` rồi khởi động lại backend.

## Kiểm thử nhanh

1. **No-show**: trong DB TEST tạo đơn đã xác nhận ngày trước, chưa có service event, chưa có Taxi bàn giao; chạy backend; kiểm tra `status='Đã hủy'`, có bản ghi booking_no_shows với `recorded_by IS NULL`, audit chỉ một dòng, không có refund hay payment receipt mới.
2. **Tự hoàn tất**: đơn `Đang thực hiện` ngày trước -> `Hoàn tất`, tiền đã thu giữ nguyên; audit chỉ một dòng.
3. **Không tự đóng sai**: lịch ngày hôm nay; đơn Daycare ngày kết thúc tương lai; đơn đã nhận pet nhưng chưa check-in; tất cả không được tự No-show.
4. **Khách**: Lịch hẹn -> Xem chi tiết -> mở QR đúng mã lịch; hủy/hoàn tiền hiển thị đúng mã và trạng thái chờ chi trả; bộ lọc Hoàn tiền.
5. **Admin**: không có tab Tài chính; mở đối soát chuyển khoản trong Lịch hẹn; tìm No-show, mở hóa đơn trong đơn; chuyển trang CSKH để xem thiết lập ngân hàng.
6. **Tìm kiếm**: tìm Grooming -> dịch vụ/đặt lịch đã chọn sẵn; tìm thức ăn -> Cửa hàng có từ khóa; nút Chat với PetDay mở chatbot; không còn số hotline giả.

## Các giới hạn kiểm thử

- Đã kiểm tra cú pháp 36 file TS/TSX, 337 bài test backend Node đạt, `node --check server/src/server.js` đạt.
- Chưa build frontend đầy đủ vì môi trường xử lý không tải được gói npm từ registry; chưa chạy kết nối PostgreSQL TEST thật trong môi trường xử lý này. Cần xác minh trên máy người dùng trước khi dùng như phiên bản chính thức.
- Tự động **tính khoản phải hoàn** không đồng nghĩa **tự chuyển tiền ngân hàng thật**. Hệ thống chỉ được hiện `Đã hoàn tiền` khi có mã/xác nhận chi trả thực tế, không lấy trạng thái đóng lịch để khẳng định đã hoàn tiền.
- Những lỗi/tính năng khác từ V6.127 (như đổi lịch HTTP 409/422) cần kiểm thử lại với DB đã nâng cấp SQL 063, không được coi là đã kiểm thử tích hợp trên máy người dùng.

# PetDay V6.104.5 — Thanh toán & dịch vụ bổ sung

## Tính năng
- Mở rộng từ 8 thành 10 gói dịch vụ (Grooming vệ sinh nhanh 110.000đ, Spa dịu nhẹ 190.000đ). Gói cũ không đổi giá.
- Tổng cộng 15 lựa chọn add-on; tối thiểu 3 lựa chọn phù hợp trên mỗi gói, tối đa chọn 3 add-on/lịch. Backend tính và kiểm tra giá; màn đặt lịch lấy add-on từ `/api/catalog`.
- Thêm sổ biên nhận `booking_payment_receipts`, không xóa bản ghi thanh toán cũ. Migration 054 backfill lịch đã thu từ trước. Migration 055 mở rộng CHECK gói dịch vụ và bảng giá.
- **Tiền mặt/chuyển khoản:** chỉ ghi đã thu sau Admin xác nhận. Hủy Taxi trước khởi hành giảm phí chịu 100%; khách hủy sau khi khởi hành mà pet chưa được đón giảm 50%; không gặp khách hợp lệ không giảm; lỗi do PetDay giảm 100%.
- Khoản chưa thu là **phải thu**, không phải **hoàn tiền**. Hoàn chỉ xử lý khi tiền thực thu còn dư, qua tạo hồ sơ → duyệt → xác nhận đã hoàn.
- Tiền mặt có thể ghi thu một phần; giao diện thu tiền mặc định ghi toàn bộ số còn phải thu. API `POST /api/admin/bookings/:code/receipts` hỗ trợ biên nhận từng phần có ghi lịch sử.
- Lịch đã hủy được báo cần đối soát phần chăm sóc riêng; không tự coi toàn bộ giá gốc là công nợ.
- Không tự chuyển tiền ngân hàng; mã đối soát bắt buộc khi ghi hoàn.

## Cập nhật local
1. Sao lưu database PostgreSQL `petday` (không thao tác Neon).
2. Chạy `database/054_v61045_booking_receipts.sql`, sau đó `database/055_v61045_service_catalog.sql` qua Query Tool của đúng database local.
3. Sao chép `server/.env` từ bản trước, không chia sẻ khóa bí mật.
4. `cd PETDAY_OFFICIAL/server && npm install && npm start`; Terminal khác `cd PETDAY_OFFICIAL && npm install && npm run dev`.
5. Kiểm tra `/api/health/schema`, `/api/health/services` và thử đặt gói mới với add-on.

## Kiểm thử tập trung
- Gói mới đặt và hiện cùng giá/line items sau reload.
- Hủy chiều đón sau khởi hành, phí gốc 70.000đ: tiền mặt chưa thu => phí phải thu 35.000đ, không tạo hồ sơ hoàn. Đã thu 70.000đ => 35.000đ được đề xuất hoàn và cần Admin duyệt.
- Chuyển khoản chỉ được đối soát sau thông báo QR và mã giao dịch; không tự đánh dấu đã thanh toán.
- Không tạo hồ sơ hoàn khi khoản phí đã được miễn trước khi nhận tiền; không hoàn trùng.

## Giới hạn kiểm chứng
- Mã nguồn và unit tests chạy được trong môi trường tạo bản; chưa chạy website kết nối trực tiếp tới PostgreSQL local của người dùng, do đó cần kiểm thử tích hợp trước khi triển khai online.

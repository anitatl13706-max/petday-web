# PetDay V6.104.11.1 — trạng thái Chờ bàn giao

- V6.104.11 đã tách Hoàn tất chăm sóc (check_out) khỏi Hoàn tất lịch (pet_handed_over / Taxi chiều về đã bàn giao).
- Nếu lịch từng bị đóng ở phiên bản cũ, database vẫn lưu status=Hoàn tất. Bản vá 057 chỉ đưa lại các lịch có check_out, chưa có pet_handed_over và Taxi chiều về chưa hoàn tất về Đang thực hiện (UI hiển thị Chờ bàn giao).
- **Sao lưu PostgreSQL local `petday`**, kiểm tra đúng DB rồi chạy `database/057_v6104111_legacy_pending_return.sql` bằng pgAdmin; KHÔNG chạy trên Neon.
- Sao chép `server/.env` từ bản cũ. Dừng cả frontend/backend bản cũ, chạy `npm install && npm start` trong server; `npm install && npm run dev` trong PETDAY_OFFICIAL.
- Test bằng lịch mới: đón pet, Check-in, bắt đầu và hoàn tất chăm sóc. Chờ bàn giao phải được hiển thị, không phải Hoàn tất. Sau khi Taxi chiều về xác nhận bàn giao, lịch mới Hoàn tất.
- Trường hợp lịch hoàn tất cũ không có bản ghi check_out sẽ **không tự động bị sửa**; nếu lỗi vẫn xuất hiện, gửi mã lịch và các trạng thái, không tự cập nhật database hàng loạt.
- Không thay đổi hóa đơn, thanh toán, Taxi refund hoặc quy tắc hoàn tiền.

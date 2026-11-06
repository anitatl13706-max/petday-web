# PetDay V6.5 — Full Source

Đây là source đầy đủ, không phải file vá. Thư mục chính: `PETDAY_OFFICIAL`.

**Giữ lại database `petday` đang có. KHÔNG chạy lại migration cũ, KHÔNG thay `.env` đang hoạt động.** Bản này không cần migration mới.

Chạy trong PowerShell ở thư mục `PETDAY_OFFICIAL/server`: `npm install` và `npm run dev`. Terminal khác tại `PETDAY_OFFICIAL`: `npm install` và `npm run dev`. Cần ngừng tiến trình cũ chiếm cổng 4000/8443.

Sao chép `server/.env` an toàn từ dự án cũ (không ghi đè bằng `.env.example`). SMTP cần cấu hình riêng. Chuyển khoản chỉ bật khi có thông tin nhận tiền hợp lệ ở `.env`. Không có QR hoặc VNPAY tích hợp trong bản này.

Đọc `docs/V6_5_KE_HOACH_NGHIEP_VU.md` để xem luồng đầy đủ và hạng mục còn chưa triển khai.

PetDay V6.118 — Email liên hệ và ưu tiên danh sách lịch

Thay đổi:
- Email footer hello@petday.vn → hellopetday123@gmail.com.
- Mặc định sắp lịch theo Ưu tiên xử lý, tách quy tắc Admin/Khách.
- Admin: Đang chăm sóc → Chờ bàn giao → Đã xác nhận → Chờ thanh toán ban đầu → Lịch sử.
- Khách: Đang chăm sóc → Chờ bàn giao → Cần thanh toán ban đầu → Đã xác nhận → Lịch sử.
- Có thể đổi về thứ tự ngày hẹn trong bộ lọc; thẻ lịch có nhãn ưu tiên nhỏ.
- Không đổi database, API, tiền cọc, logic hủy/hoàn.

Cách chạy: mở PowerShell tại thư mục PETDAY_OFFICIAL (nơi có package.json), npm install; npm run dev.
Backend chạy riêng tại PETDAY_OFFICIAL/server theo README cũ, với .env kết nối database TEST và PORT=4001.

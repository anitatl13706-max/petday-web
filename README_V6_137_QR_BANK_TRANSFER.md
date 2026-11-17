# PetDay V6.137 — Hiển thị QR ngay sau khi đặt lịch chuyển khoản

- Khách chọn **Chuyển khoản ngân hàng**: phương án bắt buộc `FULL_PREPAY`; backend tạo phiên QR cho **100% số tiền còn phải thu**, không cho tạo QR cọc 20%.
- Sau khi xác nhận đặt lịch, trang **Lịch hẹn** tự mở khung QR của lịch vừa tạo thay vì chuyển đến tab `payments` không được hiển thị. QR được tạo tự động qua `PaymentQrPanel`.
- Khách thuộc diện cọc chọn **Tiền mặt**: vẫn được chọn cọc 20% hoặc thanh toán trước toàn bộ qua QR; cả hai mở khung QR sau khi đặt.
- QR hiện tại là **QR tham chiếu/mô phỏng**, KHÔNG phải VietQR chuyển tiền thật. Chế độ `PETDAY_DEMO_PAYMENT=true` chỉ dùng trên môi trường TEST. Trong sản xuất cần tích hợp VietQR/thông tin ngân hàng xác thực và đối soát thực tế trước khi xác nhận thanh toán.
- Không cần migration database mới; giữ migration của V6.135.

Chạy Backend từ `PETDAY_OFFICIAL/server`: `npm install && npm start`. Chạy Frontend từ `PETDAY_OFFICIAL`: `npm install && npm run dev`. Đồng bộ cổng API với `vite.config.ts`.

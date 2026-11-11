# PetDay V6.104.11.4 — Chỉ hiện nút đổi / hủy lịch khi hợp lệ

Bản cập nhật giao diện trên nền V6.104.11.3. Không đổi cơ sở dữ liệu, không cần SQL migration.

## Thay đổi

- Admin: Ẩn nút Đề xuất đổi lịch và biểu mẫu đi kèm với lịch không đủ điều kiện: không Đã xác nhận, còn <= 3 giờ đến giờ hẹn, Taxi đã vận hành, đã chăm sóc/bàn giao, hoặc đã có đề xuất/yêu cầu đổi lịch đang chờ hay đã duyệt.
- Customer: Ẩn nút Đổi lịch và loại các lịch không đủ điều kiện khỏi biểu mẫu gửi yêu cầu đổi lịch.
- Customer: Ẩn nút Yêu cầu hủy lịch khi đã đến giờ hẹn, lịch đang xử lý/đã hoàn tất/đã hủy, hoặc có yêu cầu hủy đang chờ. Vẫn cho phép hủy ngay lịch chờ xác nhận và chưa thanh toán theo luồng sẵn có.
- Admin: Ẩn biểu mẫu Hủy lịch khi không còn ở trạng thái chờ xác nhận/đã xác nhận hoặc đã có yêu cầu hủy của khách chờ xử lý. Quyền Admin hủy hộ/không thể phục vụ trước khi bắt đầu vẫn giữ nguyên.
- Không thay đổi luật nghiệp vụ backend: server tiếp tục kiểm tra và chặn thao tác không hợp lệ.

## Chạy

1. Giải nén, copy `PETDAY_OFFICIAL/server/.env` từ bản đang dùng (V6.104.11.3) sang bản mới.
2. Terminal server: mở `PETDAY_OFFICIAL/server`, chạy `npm install` nếu máy chưa cài phụ thuộc, sau đó `npm start`.
3. Terminal web: mở `PETDAY_OFFICIAL`, chạy `npm install` nếu chưa cài phụ thuộc, sau đó `npm run dev`.
4. Mở đường dẫn Vite hiện trong Terminal (thường là http://localhost:8443).

## Test nhanh

- Lịch Đã xác nhận còn >3 giờ, chưa Taxi/đổi lần nào: có nút Đề xuất đổi lịch.
- Lịch Hoàn tất/Đã hủy/Không đến: không có nút đổi hoặc hủy lịch.
- Lịch đã gửi yêu cầu đổi lịch đang chờ hoặc đã được duyệt: không còn nút yêu cầu đổi lịch mới.
- Lịch đã đến giờ hẹn: không có nút Customer yêu cầu hủy lịch; dùng quy trình chăm sóc/ngoại lệ phù hợp.

Lưu ý: Một số điều kiện liên quan tới Taxi vẫn được kiểm tra lần cuối tại backend, nguồn dữ liệu chính xác nhất cho từng chiều Taxi.

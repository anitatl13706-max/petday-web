# PetDay V6.104.11.2 — Điều chỉnh giao diện bàn giao và đề xuất đổi lịch

## Hai cập nhật

1. Admin hoàn tất chăm sóc: chỉ hiển thị nút **Xác nhận khách đã nhận pet trực tiếp** khi **không có** Taxi chiều về hoặc Taxi chiều về đã đóng/hủy hợp lệ. Nếu Taxi chiều về còn hiệu lực, ẩn nút này và hướng dẫn hoàn thành bàn giao trong **Pet Taxi**. Giao diện dựa vào trạng thái thực tế của chiều về trong `pet_taxi_legs`, không chỉ dựa vào việc lịch có đăng ký Taxi. Backend tiếp tục kiểm tra trạng thái trước khi cho phép đóng lịch.
2. Admin → Lịch hẹn → thẻ lịch **Đã xác nhận**: có nút **Đề xuất đổi lịch** ngay cạnh mã lịch; bấm sẽ đưa đến biểu mẫu đề xuất trong thẻ. Customer nhận đề xuất trong **Lịch hẹn → Yêu cầu & đề xuất đổi lịch**, được **Đồng ý đổi lịch** hoặc **Giữ lịch cũ**. Thời gian chỉ thay đổi sau khi khách đồng ý. Không áp dụng cho lịch chưa duyệt, đã bắt đầu chăm sóc, hoặc chuyến Taxi đã khởi hành.

## Cài bản này

- Giữ database local đã chạy migration 056/057 từ bản V6.104.11.1; **bản này KHÔNG có migration mới**.
- Sao chép `server/.env` từ bản đang chạy sang thư mục `PETDAY_OFFICIAL/server` mới (không gửi file `.env` cho người khác).
- Dừng 2 terminal cũ, chạy `npm start` trong `server`, và `npm run dev` trong `PETDAY_OFFICIAL` (nếu chưa cài dependencies, chạy `npm install` tương ứng).
- Không chạy migration lên Neon.

## Chỉ cần test nhanh 2 tình huống

A. Lịch có Taxi chiều về: sau **Hoàn tất chăm sóc**, thấy **Chờ bàn giao**, **không có nút Bàn giao trực tiếp**; hoàn thành Taxi chiều về mới đóng lịch.
B. Lịch **Đã xác nhận** và chưa bắt đầu: Admin bấm **Đề xuất đổi lịch** ở đầu thẻ, nhập ngày, giờ, lý do → gửi. Customer đồng ý hoặc từ chối, thời gian mới chỉ cập nhật khi đồng ý.

## Kiểm tra đã thực hiện

- 277/277 bài test backend đạt.
- Kiểm tra cú pháp 35 file TypeScript/TSX đạt.
- Chưa kiểm thử UI chạy thực tế với database local của người dùng.

# PetDay V6.104.6 — Lịch hẹn & hóa đơn tinh gọn

Phiên bản nền: V6.104.5. Chỉ điều chỉnh giao diện; giữ nguyên API, chính sách, dữ liệu, migration và backend V6.104.5.

## Admin → Lịch hẹn
- Mặc định: **Đang xử lý**, sắp xếp ngày/giờ phục vụ tăng dần; có nhóm nhanh Chờ duyệt, Đang phục vụ, Hoàn tất, Đã hủy/No-show.
- Hoàn tất và đã hủy nằm ở nhóm tra cứu, không bị xóa khỏi PostgreSQL.
- Biểu mẫu **Ghi No-show** và **Admin hủy lịch** chỉ xuất hiện sau khi mở từng mục.
- Giữ nguyên quy tắc 15 phút Grooming/Spa, 30 phút Daycare, Check-in trước khi bắt đầu chăm sóc.

## Pet Taxi
- Mỗi chiều hiển thị gọn tên, trạng thái, phí; nhấn vào mới xem nút điều phối và lịch sử.
- Nếu có yêu cầu hủy sau xuất phát, tóm tắt đánh dấu **CẦN XỬ LÝ HỦY** và mặc định mở chi tiết; ẩn nút Hoàn tất chuyến để tránh thao tác nhầm.
- Admin mở **Xử lý ngoại lệ**, ghi lý do từ 8 ký tự, xác minh pet chưa lên xe để chốt chính sách 50%.
- Lịch sử hoạt động của Taxi khác với lịch sử chuyển khoản. Không đồng nghĩa đã hoàn tiền.

## Hóa đơn và hoàn tiền
- Trong chi tiết lịch Admin, mở **Hóa đơn & đối soát** để lấy dữ liệu thực từ `/api/admin/bookings/{code}/settlement`.
- Giá gốc, điều chỉnh Taxi, phí phải chịu, số đã thu, còn phải thu, đã hoàn được hiện riêng.
- Tiền mặt chưa thu: giảm số còn phải thu, KHÔNG tạo hoàn tiền.
- Đã thu dư thực tế: chỉ tạo hồ sơ hoàn theo quy trình Tài chính; thông báo khách đã chuyển không bằng xác nhận đã thu.
- Không tự ghi nhận tiền vào/ra; giữ các điều kiện chống hoàn trùng đã có trong backend.

## Chạy local
1. Sao lưu bản cũ và sao chép `PETDAY_OFFICIAL/server/.env` từ V6.104.5.
2. Không chạy migration mới nếu database đã cập nhật đến `055`.
3. Terminal 1: `cd PETDAY_OFFICIAL/server && npm install && npm start`.
4. Terminal 2: `cd PETDAY_OFFICIAL && npm install && npm run dev`.

## 4 bài kiểm thử tích hợp trọng tâm
1. Lịch Admin: các tab + thứ tự + mở/đóng No-show và hủy lịch; không thao tác gì thì không tạo thay đổi dữ liệu.
2. Taxi sau xuất phát có yêu cầu hủy: ưu tiên hủy, không hiển thị nút hoàn tất nổi bật; xác minh pet chưa được đón, ghi lý do, chốt 50%.
3. Tiền mặt **chưa thu**: hóa đơn có giảm phí Taxi, chỉ còn tiền phải thu; không tự lập hồ sơ hoàn.
4. Chuyển khoản **đã xác nhận thu**: sau giảm phí Taxi, thấy tiền dư và xử lý qua Tài chính; tải lại không thay đổi kết quả.

## Phạm vi kiểm tra tại thời điểm đóng gói
- Backend unit tests: 256/256 đạt.
- Frontend TS/TSX: kiểm tra cú pháp 35/35 đạt (không thay thế build Vite hoặc kiểm thử trình duyệt).
- Chưa chạy thử với PostgreSQL local/đăng nhập thực tế của người dùng.

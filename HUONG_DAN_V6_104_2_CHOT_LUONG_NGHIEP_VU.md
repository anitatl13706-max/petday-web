# PetDay V6.104.2 — Chốt luồng nghiệp vụ, giảm thao tác

Cơ sở: V6.104.1. Phiên bản này chỉ sửa các điểm đồng bộ và bố cục; không thay đổi bảng PostgreSQL và không thêm migration.

## Các thay đổi thực tế

1. Khi Admin hủy lịch hoặc ghi nhận No-show, backend **khởi tạo các chiều Taxi còn thiếu từ bản ghi Taxi cũ trước khi đóng**. Điều này tránh trường hợp lịch đã đóng nhưng sau đó mở mục Taxi lại xuất hiện chuyến "Chờ xác nhận".
2. Nếu một lịch đã đóng được đọc từ dữ liệu Taxi cũ, lượt chưa thực hiện được tạo với `cancelled` và phí hoàn *dự kiến* bằng phí chiều đó; lượt đã bàn giao thực tế được bảo toàn, không tự hoàn.
3. Giao diện mỗi chiều Taxi hiển thị chỉ dẫn bước tiếp theo và các nút thường dùng. Nhóm thao tác ngoại lệ được gấp dưới "Xử lý ngoại lệ"; việc ghi lý do và xác minh khách vắng mặt vẫn được backend bắt buộc.
4. Admin được nhắc rõ về điều kiện No-show: Spa/Grooming sau 15 phút, Daycare sau 30 phút, và chưa Check-in. Taxi không gặp khách không tự tạo No-show dịch vụ.
5. Giữ nguyên sổ hoàn Taxi từng chiều: tạo hồ sơ -> duyệt -> ghi nhận đã hoàn bằng mã đối soát. Không tự chuyển tiền và không tự gộp hoàn tiền dịch vụ với Taxi.

## Các quy tắc giữ nguyên

- 2 vai trò chính Customer và Admin, Admin trực tiếp Check-in, bắt đầu và hoàn tất dịch vụ.
- Check-in trước khi bắt đầu chăm sóc. Chiều về chỉ xuất phát sau khi có mốc `ready`.
- Hai chiều Taxi độc lập. Không tự hủy dịch vụ nếu Taxi thất bại.
- Khi lịch đóng, chỉ tự đóng các chuyến Taxi chưa xuất phát. Chuyến đang đi cần giải quyết riêng.
- Không tạo hoàn vượt tổng đã thu, không tạo hai hồ sơ Taxi cho cùng một chiều.

## Kiểm thử trong môi trường tạo bản

- 242/242 bài kiểm thử backend (Node.js test runner) đạt.
- 33/33 file TypeScript/TSX qua kiểm tra cú pháp.
- `node --check server/src/server.js` đạt.
- **Chưa** chạy npm build đầy đủ hoặc E2E với PostgreSQL của người dùng; cần kiểm tra trực tiếp trước khi triển khai thực tế.

## Cách chạy local

1. Sao lưu database `petday` và giữ nguyên bản V6.104.1 dự phòng.
2. Database đã áp dụng migration `051`, `052`, `053` thì **không cần chạy migration mới**.
3. Sao chép `server/.env` từ bản đang chạy; không đưa `.env` lên Git.
4. Terminal backend: `cd PETDAY_OFFICIAL/server`, `npm install`, `npm start`.
5. Terminal frontend: `cd PETDAY_OFFICIAL`, `npm install`, `npm run dev`.

## 6 tình huống tích hợp nên kiểm tra một lượt

1. Đặt lịch không Taxi -> Check-in -> Bắt đầu -> Hoàn tất.
2. Taxi hai chiều -> chiều đón hoàn tất -> Check-in -> chăm sóc -> `ready` -> chiều về.
3. Khách tự đưa pet đến -> đóng chiều đón -> Check-in -> vẫn dùng chiều về -> hoàn dự kiến nếu đã trả.
4. Taxi không gặp khách -> lịch dịch vụ vẫn hoạt động; No-show dịch vụ sau thời hạn mới đóng Taxi chưa đi.
5. Hủy lịch đã trả tiền -> tách hoàn dịch vụ và từng chiều Taxi, duyệt và xác nhận hoàn không vượt số tiền đã thu.
6. Cửa hàng và thanh toán QR không bị ảnh hưởng bởi thay đổi Taxi.

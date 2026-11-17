# PetDay V6.123 – Pet Taxi là tiện ích add-on

## Thay đổi giao diện
- Pet Taxi chỉ còn là tiện ích bổ sung trong bước đặt lịch.
- Khách có đúng 3 lựa chọn: Chiều đón (Nhà → PetDay), Chiều trả (PetDay → Nhà), Đón và trả (hai chiều).
- Nhân viên/Admin chủ động liên hệ khách để thống nhất thông tin đưa đón.
- Bỏ khu vực điều phối Taxi riêng trong trang Lịch hẹn Admin.
- Bỏ bảng theo dõi Taxi riêng trong chi tiết lịch khách hàng/Admin.
- Bỏ mục/tab Pet Taxi trong Tài chính và bỏ danh sách hoàn phí Taxi riêng trên giao diện.
- Phí Taxi vẫn được tính vào tổng giá trị lịch hẹn; không tạo nhóm quản lý thu/chi Taxi độc lập trên giao diện.
- Khi hủy toàn bộ lịch, phí add-on được xử lý cùng chính sách hủy lịch hiện hành.
- Không cung cấp chức năng hủy riêng add-on Taxi sau khi lịch đã được đặt.

## Dữ liệu cũ
Không xóa bảng, cột, giao dịch hay lịch sử Taxi cũ trong database. Các API/backend Taxi cũ được giữ lại để tương thích dữ liệu lịch sử; giao diện mới không còn điều phối hoặc hiển thị trạng thái chuyến riêng.

## Chạy dự án
Giải nén, mở thư mục PETDAY_OFFICIAL, chạy `npm install` rồi `npm run dev`.
Backend chạy trong thư mục `server`: `npm install`, cấu hình `.env` PostgreSQL TEST, sau đó `npm start` với PORT=4001.

## Kiểm thử cần thực hiện
1. Đặt lịch không có Taxi.
2. Đặt lịch có Taxi chiều đón.
3. Đặt lịch có Taxi chiều trả.
4. Đặt lịch Taxi hai chiều.
5. Kiểm tra phí Taxi được cộng vào tổng lịch hẹn.
6. Kiểm tra Admin không còn tab điều phối Taxi.
7. Kiểm tra Tài chính không còn mục Pet Taxi/hoàn phí Taxi riêng.
8. Hủy toàn bộ lịch và kiểm tra chính sách hoàn lịch áp dụng cho khoản đã thu.

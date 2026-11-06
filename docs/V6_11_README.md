# PetDay V6.11 — Stable API & Essential Operations

## Đã sửa
- Đăng nhập không bị coi là thất bại chỉ vì `/api/bookings` hoặc `/api/pets` lỗi. API `/api/me` kiểm tra phiên trước, các dữ liệu bổ sung tải riêng.
- Thông báo lỗi HTTP chỉ rõ endpoint. Nếu thiếu cột/bảng PostgreSQL, API trả 503 cùng hướng dẫn thay vì 500 chung.
- `GET /api/health/schema` kiểm tra các bảng/cột tối thiểu, không trả mật khẩu hay thông tin khách hàng.
- Admin Dashboard KPI đọc thật từ PostgreSQL, không dùng số giả; không bao gồm doanh thu đơn chưa thu.
- Thêm `database/008_v611_repair.sql` để bổ sung cấu trúc còn thiếu. Không tự chạy SQL và không ghi đè dữ liệu cũ.

## Trước khi cài
1. Sao lưu database petday trong pgAdmin. Không chạy lại 001/002 trên database có dữ liệu.
2. Copy đúng `server/.env` đang hoạt động. Cẩn thận không chia sẻ mật khẩu, JWT_SECRET.
3. Chạy server và frontend ở hai terminal riêng, tránh EADDRINUSE.
4. Kiểm tra `http://localhost:4000/api/health` và `http://localhost:4000/api/health/schema`.
5. Nếu schemaReady=false, đọc các cột thiếu rồi chạy file 008 nếu phù hợp với database đang dùng. File 008 chỉ có tác dụng thêm cấu trúc, không khắc phục lỗi sai tài khoản/mật khẩu.

## Luồng nghiệp vụ giữ nguyên
- Customer đăng ký/đăng nhập, quản lý thú cưng, kiểm tra báo giá, đặt lịch và mã ưu đãi, theo dõi thanh toán, yêu cầu đổi lịch, hủy theo điều kiện, đánh giá sau hoàn tất.
- Admin xem tổng quan, xác nhận/trạng thái lịch, ghi nhận đã thu tiền sau đối soát, duyệt đổi lịch, phản hồi tư vấn, lưu nhật ký chăm sóc.
- Thanh toán chuyển khoản phải cấu hình tài khoản thật. Không có QR VietQR, cổng VNPAY, đối soát tự động, thông báo realtime hoặc quản lý promotion UI trong phiên bản này.

## Kiểm thử ưu tiên
- Health và Schema; đăng nhập cả customer/admin; bảng pets trống; đặt lịch ở slot hợp lệ; xác nhận admin; thu tiền khi có bằng chứng; hoàn tất; review.
- Nếu login trả 401: kiểm tra thông tin đăng nhập, tuyệt đối không chỉnh trực tiếp password_hash.

# PetDay V6.15 — Công suất và dịch vụ cộng thêm

## 1. Nguyên tắc
- Luồng đặt lịch gồm 4 bước: thú cưng → gói chính + tùy chọn cộng thêm → chi nhánh/ngày/giờ → giá, mã ưu đãi và thanh toán.
- Server tính lại hoàn toàn giá add-on từ mã; không chấp nhận giá tiền do trình duyệt gửi.
- Tối đa 3 tùy chọn, không lặp, chỉ áp dụng các gói hợp lệ. Giá add-on được lưu ngay trong `bookings.line_items` dạng JSON.
- Admin khóa giờ trống: từ chối nếu có bất kỳ lịch chưa hủy, thao tác được bảo vệ bởi advisory transaction lock, sau đó API kiểm tra chỗ và tạo lịch đều từ chối thời gian khóa.
- Duyệt yêu cầu đổi giờ phải kiểm tra cả đóng giờ lẫn công suất. Mở khóa không tự tạo đơn mới.
- Chuyển khoản chỉ hoàn thành sau xác nhận thủ công của nhân viên có mã đối soát.

## 2. Cài đặt
1. Backup PostgreSQL `petday`.
2. Chỉ sau khi chạy migrations 001–011 theo thực trạng, áp dụng `database/012_v615_capacity_management.sql` trên pgAdmin.
3. Chuyển `server/.env` từ bản đang chạy (không đính kèm secrets trong ZIP).
4. Khởi động một server cổng 4000 và một frontend cổng 8443; mở `/api/health/schema`.

## 3. Test nghiệp vụ bắt buộc
- Thêm 1 add-on Spa, xem `quote.total`, nhập mã ưu đãi, đặt lịch. Kiểm tra JSON `line_items` và tổng trong PostgreSQL.
- Gửi add-on không hợp lệ trực tiếp tới API: phải từ chối.
- Admin khóa giờ chưa có lịch → khách kiểm tra chỗ phải thấy không còn khả dụng; tạo lịch trực tiếp cũng phải bị từ chối.
- Admin cố khóa giờ đang có lịch → 409, không xóa lịch.
- Khách yêu cầu đổi sang giờ đã khóa → Admin duyệt phải bị từ chối.
- Mở khóa rồi thử đặt giờ đó; kiểm tra chỗ vẫn do server quyết định.
- Hai người cùng đặt chỗ còn một slot → chỉ một thành công khi vượt công suất.
- Kiểm tra thanh toán cash và bank_transfer, trạng thái chưa thanh toán vẫn giữ nguyên cho đến khi nhân viên đối soát.

## 4. Chưa triển khai
Đây chưa phải quản lý ca làm từng nhân viên, Pet Taxi có định tuyến, thanh toán VNPAY/VietQR tự động, hóa đơn thuế hay nhắc lịch tự động; những phần này cần nguồn dữ liệu và tích hợp thực tế riêng.

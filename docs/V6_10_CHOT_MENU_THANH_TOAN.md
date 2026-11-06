# PetDay V6.10 — giao diện tối giản và luồng kiểm thử

## Menu Customer (4 mục)
1. Tài khoản & thú cưng — hồ sơ, pet profile và bảo mật trong một trang.
2. Lịch hẹn của tôi — trạng thái, yêu cầu hủy/đổi, đánh giá chỉ khi hoàn tất.
3. Thanh toán — chi tiết tiền và phương thức theo lịch, trạng thái không phụ thuộc trạng thái chăm sóc.
4. Hỗ trợ & thông báo — câu hỏi, phản hồi, tổng hợp cập nhật. Không phải live chat.

## Menu Admin (3 mục)
1. Tổng quan; 2. Lịch hẹn & đổi lịch; 3. Hỗ trợ khách hàng. Các tác vụ thanh toán đang nằm bên trong quản lý lịch, chưa có sổ đối soát đầy đủ.

## Hai phương thức thanh toán
- **Tiền mặt**: luôn khả dụng, nhân viên đánh dấu thu tiền sau khi thực nhận.
- **Chuyển khoản**: luôn nhìn thấy nhưng bị khóa tới khi cấu hình đủ `PETDAY_BANK_NAME`, `PETDAY_BANK_ACCOUNT`, `PETDAY_BANK_HOLDER` trong `server/.env` và khởi động lại backend.
- Khi mở chuyển khoản, backend lưu lựa chọn cùng booking và cung cấp hướng dẫn chuyển khoản trong chi tiết lịch. **Chưa có VietQR / đối soát tự động**. Admin phải xác minh tiền trong tài khoản ngân hàng trước khi cập nhật trạng thái. Không dùng bằng chứng ảnh làm xác nhận duy nhất.
- Thông tin tên ngân hàng là nhãn để hiển thị. Nếu làm VietQR sau này, bổ sung mã BIN ngân hàng theo dữ liệu chính thức và chuẩn EMVCo/VietQR.

## Luồng hoàn chỉnh còn phải xây trước khi nộp
1. Admin cấu hình thanh toán qua UI có phân quyền, nhật ký thay đổi, sổ xác minh, hoàn tiền.
2. Thông báo DB unread/read, lịch sử sự kiện và thông báo email có hàng đợi khi có SMTP.
3. Quản trị dịch vụ/giá/công suất, quy tắc khuyến mãi có CRUD riêng.
4. Check-in/Check-out và Pet Care Timeline; giao thú cưng, ảnh nhật ký và đánh giá khi hoàn tất.
5. Hộp thư tư vấn nhiều lượt với trạng thái, người phụ trách và thông báo phản hồi.
6. Add-on, Pet Taxi và mua kèm phải có bảng giá, kiểm tra tồn/công suất, lưu line_items cùng booking.

## Kiểm thử tối thiểu
- Customer: bốn mục menu dẫn đúng nơi; 2 phương thức hiện rõ; chưa cấu hình bank không chọn được.
- Admin: ba thẻ điều hướng đến lịch hẹn / đổi lịch / tư vấn; quyền Customer bị từ chối.
- Cấu hình bank từ .env rồi khởi động lại: hai phương thức chọn được; đặt lịch chuyển khoản vẫn unpaid.
- Giá khuyến mãi kiểm tra lại backend; không thay đổi booking khi chưa xác nhận.
- Không chạy lại các migration cũ; chỉ chạy SQL 007 nếu chưa chạy và đã sao lưu DB.

**Giới hạn kiểm thử**: các mục chưa có API thật vẫn được ghi là chưa hoàn thiện, không tạo dữ liệu thanh toán giả.

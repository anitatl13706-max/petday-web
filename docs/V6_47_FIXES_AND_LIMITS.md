# PetDay V6_47 — giới hạn & cách hoàn thiện

Bản này tách Cửa hàng thành route #cua-hang, giữ luồng đơn bán lẻ độc lập đã tồn tại và thay mô tả 3 nhóm dịch vụ. Không xác nhận đã thử luồng PostgreSQL thực tế.

## Dữ liệu sản phẩm
- 4 sản phẩm trong database/024 chỉ là dữ liệu mẫu của đợt đầu.
- database/028_v647_optional_retail_catalog_seed.sql bổ sung 12 sản phẩm MẪU khi được chạy thủ công trên PostgreSQL TEST (16 tổng cộng nếu bắt đầu với đúng 4 và chưa có hàng khác). Giá/tồn kho trong seed là giả định phục vụ đồ án, không là dữ liệu kinh doanh thật.
- Chụp backup trước khi chạy. Không chạy trên production mà không rà soát dữ liệu. Admin có thể chủ động CRUD, đóng bán, điều chỉnh số lượng.
- Cửa hàng độc lập vẫn CHỈ hỗ trợ nhận tại chi nhánh, tối đa 3 loại × 3 sản phẩm, chưa giao tận nhà.

## SMTP / quên mật khẩu
- Cần server/.env với SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, RESET_BASE_URL (URL thực tế của frontend: xem cổng Vite). Ví dụ Gmail phải bật 2FA và dùng App Password, không dùng mật khẩu đăng nhập thường.
- Khởi động lại backend, GET /api/health/features để kiểm tra configured; sau đó phải gửi thử email khôi phục và đặt lại mật khẩu thành công. Không chia sẻ .env hoặc ảnh mật khẩu ứng dụng.
- Token đặt lại hết hạn 30 phút; xem src/Portal.tsx, server/src/server.js. Chưa kết luận hoạt động khi chưa thử gửi SMTP.

## Chuyển khoản
- Trong Admin → Tài chính → Thiết lập ngân hàng, cập nhật đầy đủ thông tin tài khoản và lưu. Tải lại frontend rồi tạo LỊCH MỚI chọn chuyển khoản.
- KHÁCH gửi yêu cầu xác minh sau chuyển, NHÂN VIÊN kiểm tra giao dịch thật trong tài khoản ngân hàng, rồi ghi nhận vào sổ thu tiền. Không tự động xác nhận giao dịch. Nếu hiển thị lỗi /api/health/schema, dừng test và đồng bộ các migration thiếu với database TEST có backup; không giả định các migration 009–027 đã chạy.
- Đơn hàng bán lẻ có workflow riêng; kiểm tra nó cùng sổ thu tiền và tình trạng tồn kho trước khi nộp.

## Pet Taxi
- 70.000/120.000đ hiện là PHÍ TẠM TÍNH theo vùng do khách tự khai; **không phải tự động xác định vị trí**. Chưa tích hợp bản đồ/geocoding hoặc danh sách phường chính thức theo chi nhánh.
- Cần triển khai trong phiên bản tiếp theo: chọn tỉnh/thành, phường/xã có mã vùng; kiểm tra vùng phục vụ theo từng chi nhánh ở backend; nhân viên đối chiếu số nhà, chốt cước và xác nhận chuyến. Nếu không xác minh được thì không xác nhận dịch vụ taxi.

## QA chưa hoàn tất
- Cần npm install + npm run build, chạy server test, kiểm thử đăng nhập, đổi mật khẩu, 2 dịch vụ khác giờ, mua kèm, mua độc lập, hết tồn kho, thanh toán chuyển khoản, hoàn tiền. Các thay đổi giao diện không có nghĩa các quy trình trên đã được xác minh end-to-end.

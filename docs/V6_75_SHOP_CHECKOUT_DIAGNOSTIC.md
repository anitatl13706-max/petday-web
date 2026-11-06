# PetDay V6_75 - Kiểm tra nút Xác nhận đơn cửa hàng

- Bản cập nhật từ V6_74; không đổi schema/database, không xoá lịch sử.
- Trang Cửa hàng hiển thị lý do không thể xác nhận thay vì chỉ vô hiệu hóa nút.
- Kiểm tra: có sản phẩm; số lượng không vượt tồn kho; họ tên >=2 ký tự; số điện thoại 10 chữ số bắt đầu bằng 0 hoặc +84; địa chỉ giao hàng >=12 ký tự; thanh toán được hỗ trợ.
- Nếu hết hàng, khách giảm số lượng/xóa sản phẩm; nhấn Cập nhật lại tồn kho để kiểm tra dữ liệu mới.
- Nút có thể nhấn để hiện thông báo kiểm tra khi form chưa hợp lệ, nhưng không gửi đơn sai thông tin lên backend.
- Sau khi hợp lệ, backend vẫn xác thực người dùng, tồn kho và số tiền; có thể trả lỗi database nếu migration cũ thiếu.
- Không khẳng định đơn đã tạo nếu chưa kiểm thử thực tế với PostgreSQL TEST.

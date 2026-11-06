# PetDay V6.62 — Customer & Shop (Giai đoạn 2)

## Đã triển khai
- Trang chủ hiển thị đủ sáu danh mục, chuyển vào đúng nhóm đã chọn.
- Cửa hàng: tìm kiếm, danh mục, lọc chó/mèo (suy luận theo tên; chưa có trường loài ở DB), khoảng giá, còn hàng; tách sắp xếp tên/giá.
- Mỗi thẻ sản phẩm có nút xem chi tiết, modal ảnh/tên/mô tả/giá/tồn kho và thao tác thêm giỏ.
- Giỏ có tăng, giảm và xóa theo từng sản phẩm; kiểm tra số lượng, tồn kho trước khi cho gửi.
- Checkout có lựa chọn nhận tại cửa hàng/giao tận nhà, báo phí khu vực dự kiến, bắt nhập số điện thoại hợp lệ; backend tiếp tục tính lại phí, giá, tồn kho.
- Tài khoản Customer: thanh điều hướng nhanh tới hồ sơ, pet, bảo mật, thông báo, hỗ trợ; vẫn giữ dữ liệu/biểu mẫu gốc.
- Ghi nhận báo cáo ảnh 90 sản phẩm ở `V6_62_CATALOG_IMAGE_AUDIT.csv`.

## Giới hạn cần biết
- Source chỉ đóng gói frontend/backend và các asset, không tự động sửa dữ liệu PostgreSQL. Migrations 037/038 phải được kiểm tra và chạy trên DB TEST có backup nếu chưa áp dụng.
- Chỉ hiển thị chính xác 90 sản phẩm sau khi PostgreSQL đã đủ tên chuẩn như V6.59; sản phẩm cũ được giữ lịch sử.
- Ảnh là hình minh họa AI, không phải ảnh SKU xác minh từ nhà sản xuất.
- Loài chó/mèo được suy luận từ tên hàng; sản phẩm không phân biệt được xem là dùng chung.
- Không cấu hình SMTP hoặc tích hợp đơn vị vận chuyển thực tế trong đợt này.
- Không tự ý thay đổi dữ liệu, mật khẩu, tài khoản ngân hàng hay lịch sử thanh toán.

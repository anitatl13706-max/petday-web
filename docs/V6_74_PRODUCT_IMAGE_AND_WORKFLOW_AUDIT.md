# PetDay V6.74 — kiểm tra ảnh mua kèm và luồng nghiệp vụ

## Lỗi ảnh được xác nhận và sửa
- `public/shop/products/xit-duong-long-bong-khoe.webp` trước đây là ảnh bóng đồ chơi nhồi hạt; đã thay bằng hình chai xịt dưỡng minh họa.
- Ảnh thay thế là minh họa thiết kế, **không phải ảnh sản phẩm thực/ảnh nhà cung cấp**. Khi phát hành thương mại cần tải ảnh SKU được cấp phép.
- Cả cửa hàng chính và khối mua kèm đều trỏ đến cùng file ảnh theo tên sản phẩm.
- Khi thay gói dịch vụ, sản phẩm mua kèm đã chọn vẫn được hiển thị để khách có thể giảm/xóa và xem tổng tiền.

## Rà soát các luồng có code sẵn (chưa phải nghiệm thu trên DB của người dùng)
1. Đặt lịch: booking được kiểm tra trên server theo gói, thời gian, loài, cân nặng và khả năng phục vụ; kết quả cuối cùng phụ thuộc migration DB.
2. Nhân viên: admin duyệt lịch và phân công; không cần tài khoản riêng cho từng hồ sơ nhân viên trong bản demo.
3. Pet Taxi: giá là báo giá vùng thủ công, không phải định tuyến bản đồ. Trạng thái taxi độc lập với thanh toán/dịch vụ; đã bàn giao thì không được ghi khách không đến.
4. Dịch vụ: sau xác nhận, Bắt đầu dịch vụ và Hoàn tất là 2 mốc bắt buộc; ảnh check-in không còn bắt buộc.
5. Hủy lịch: yêu cầu hủy lịch đã xác nhận được admin duyệt/từ chối; nếu trạng thái lịch đã thay đổi có thể trả HTTP 409 và cần tải lại danh sách.
6. Khách không đến: server chỉ cho xử lý lịch đã xác nhận, chưa có sự kiện chăm sóc và chưa được taxi bàn giao; hành động trước giờ hẹn là admin đóng lịch sau xác minh, không chứng minh khách đã vắng mặt.
7. Mua kèm: tối đa 3 loại, 3 cái/loại, phải kiểm tra giá và tồn kho tại server khi tạo lịch.
8. Cửa hàng: xử lý đơn nhận tại quầy và giao tận nhà tách khỏi lịch dịch vụ. Trạng thái shipping cần migration 039; xác nhận thanh toán tách khỏi trạng thái giao hàng.
9. Thanh toán chuyển khoản demo: không tự xác nhận đã nhận tiền thật; cấu hình bằng `PETDAY_DEMO_PAYMENT=true` khi sử dụng chế độ mô phỏng.

## Giới hạn và các điểm cần kiểm thử trên PostgreSQL TEST
- Chưa kết nối PostgreSQL của người dùng nên chưa thể khẳng định migration 022 (8 gói) / 039 (giao hàng) đã được áp dụng.
- Nếu `/bookings` trả 503 hoặc quản lý đơn báo schema chưa đồng bộ, cần xem logs và chạy `npm run db:doctor` để chẩn đoán. Không chạy lại hàng loạt SQL cũ.
- Chạy 3 bài E2E: dịch vụ không taxi, dịch vụ có taxi & hủy, và cửa hàng giao tận nhà (có xác nhận tiền) để nghiệm thu.

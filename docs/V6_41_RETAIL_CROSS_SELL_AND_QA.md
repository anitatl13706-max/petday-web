# PetDay V6.41 — Sản phẩm mua kèm và vận hành tồn kho

## Mục đích
V6.40 có 8 gói trong 3 nhóm và add-on/Pet Taxi; V6.41 bổ sung **sản phẩm vật lý mua kèm** khác với add-on dịch vụ. Được tích hợp vào báo giá và lịch hẹn, giữ tồn kho trong giao dịch tạo lịch; khi trạng thái lịch chuyển thành Đã hủy, trigger hoàn tồn đúng một lần.

## Chuẩn bị
1. Sao lưu `petday` trong pgAdmin (Custom).
2. Kiểm tra API V6.40 `/api/health/schema` đã OK.
3. Chạy **chỉ** `database/024_v641_retail_booking.sql` trên DB hiện tại sau SQL 023; không chạy lại SQL 001–023.
4. Sao chép `server/.env` từ V6.40 (không chia sẻ hoặc đóng ZIP); cài `npm install` và chạy frontend/backend.

## Nghiệp vụ
- Admin (tab Tài chính) thêm và sửa sản phẩm, giá, tồn kho, tắt mở bán. Không xóa lịch sử giao dịch.
- Khách chọn tối đa 3 loại sản phẩm, tối đa 3 chiếc mỗi loại, ở bước 2 của đặt lịch. Tổng giá hiển thị và server định giá lại bằng DB tại thời điểm booking.
- Khi khách xác nhận lịch, server khóa các hàng sản phẩm (`FOR UPDATE`), kiểm tra tồn, lưu đơn giá vào booking_retail_items, cộng dòng tiền vào line_items và giảm stock trong **cùng transaction**. Thao tác tạo lịch lỗi thì toàn bộ thay đổi rollback.
- Trigger hoàn tồn chỉ khi lịch chuyển sang Đã hủy và chưa từng hoàn, không chỉnh lại giá của lịch cũ.
- Hàng mua kèm nhận tại cơ sở; chưa có giao hàng đơn riêng hoặc quản trị trả hàng độc lập.

## Tình huống kiểm thử
1. Admin mở Tài chính, xem được 4 mẫu seed; thử thêm sản phẩm và sửa giá/tồn, làm mới còn dữ liệu.
2. Khách chọn 1 sản phẩm, so sánh chi tiết báo giá và tổng tiền với đơn giá nguồn DB.
3. Đặt một lịch thành công, kiểm tra DB booking_retail_items và retail_products.stock giảm.
4. Tạo lịch thứ hai vượt tồn kho: server phải trả thông báo, không tạo booking hay tồn âm.
5. Hủy lịch: stock hoàn lại đúng số lượng một lần.
6. Giữ lịch và thay đổi giá bán ở Admin: giá booking cũ giữ nguyên.
7. Chọn hàng hết tồn: không bấm tăng được và server vẫn chống kiểm tra lại.
8. Thanh toán tiền mặt hoặc chuyển khoản: vẫn theo quy trình đối soát thủ công V6.40, không tự đánh dấu đã nhận tiền.

## Còn thiếu so với toàn bộ đề án
- Quản lý dịch vụ bằng CRUD động: 8 gói vẫn định nghĩa trong source, cần thiết kế lại quy tắc giá và capacity trước khi cho sửa bằng Admin.
- Đơn hàng thương mại điện tử độc lập/giao vận, trả hàng từng sản phẩm, quản lý nhà cung cấp: chưa có.
- Khôi phục mật khẩu bằng email: đã có luồng token nhưng phụ thuộc SMTP thật.
- Nhắc lịch hiện là thông báo nội bộ, chưa là email/SMS.
- Cần thực hiện end-to-end trên PostgreSQL của bé và kiểm tra `npm run build` trước khi nộp.

## Lưu ý
Mức giá và số lượng seed là **dữ liệu thử đồ án**, không đại diện hàng hóa hay tồn kho thật. Phần này không giới thiệu thêm nhóm dịch vụ chính: Grooming, Spa, Daycare là ba phân loại nghiệp vụ; mỗi nhóm có các gói con riêng.

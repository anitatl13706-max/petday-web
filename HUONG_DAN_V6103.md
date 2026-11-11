# PetDay V6.103 – Thanh toán gọn & Đổi lịch

- Cửa hàng: bỏ bảng tài khoản cũ ở bước checkout; QR xuất hiện sau khi tạo đơn tại Lịch sử mua hàng.
- QR: không thay đổi API hoặc thời hạn 15 phút; biểu mẫu xác nhận giữ các trường ngân hàng người chuyển và tên người chuyển cần thiết.
- Chỉ còn một thông báo ngắn cho QR giả lập: không dùng để chuyển tiền thật.
- Đổi lịch: mở lại trang quản lý yêu cầu đang bị ẩn, thêm form cho lịch hiệu lực, nút trên thẻ lịch; Admin duyệt/từ chối.
- Backend chặn yêu cầu quá sát 3 giờ, quá một lượt đổi thành công; giữ nguyên các kiểm tra về xung đột giờ, capacity, nhân sự, Pet Taxi.
- Không yêu cầu migration mới; bảng booking_reschedule_requests đã có trong migration 009.
- Giữ nguyên server/.env của máy bé; ZIP không chứa mật khẩu/cấu hình riêng.

Kiểm thử lại: luồng mua hàng QR, 15 phút, thông báo chuyển khoản, Admin xác nhận; khách đổi lịch khi đủ điều kiện; lịch quá 3 giờ; một lần đổi; Admin duyệt và từ chối; Taxi cần xác nhận lại sau duyệt.

## Bản vá hiển thị nút Đổi lịch
- Sửa vị trí JSX: nút Đổi lịch trước đó đặt nhầm trong nhánh giao diện Admin nên không bao giờ hiển thị cho Customer. Nay nút nằm trong nhánh thẻ lịch Customer.
- Đường dẫn thao tác: Tài khoản → Lịch hẹn → Đổi lịch → chọn ngày/giờ tại mục Yêu cầu đổi lịch của tôi.

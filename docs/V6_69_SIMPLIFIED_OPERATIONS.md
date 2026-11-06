# PetDay V6.69 — Vận hành tinh gọn, không tải ảnh check-in

## Phạm vi triển khai
- Bỏ lựa chọn tải ảnh trong mốc check-in/chăm sóc ở giao diện Admin; không động tới ảnh hồ sơ thú cưng của khách.
- Dịch vụ chỉ yêu cầu 2 mốc: **Bắt đầu dịch vụ** (sau duyệt + phân công và taxi nếu có đã bàn giao) và **Hoàn tất dịch vụ** (sau khi chăm sóc xong và bàn giao).
- **Ghi chú chăm sóc** là tùy chọn giữa hai mốc. Các event cũ `care_update` và `ready` vẫn đọc được, không xóa lịch sử. Backend vẫn ghi người thao tác, thời điểm, ghi chú; không bắt buộc ảnh.
- Giữ màn Nhân viên & phân công với 4 hồ sơ mặc định (Thanh Lam, Thiên Ân, Phụng Anh, Bảo Yến), không cần tài khoản staff/ca hàng loạt.
- Pet Taxi chỉ có thể nhận chuyến trên lịch đã duyệt, gần thời gian hẹn. **Taxi đã bàn giao** không làm thay đổi trạng thái chăm sóc hoặc thanh toán.
- Cửa hàng: Quản trị → Đơn hàng cửa hàng, xử lý theo nhận tại quầy hoặc giao tận nhà, thanh toán riêng.

## Quy trình nghiệm thu thực tế
1. Admin duyệt lịch, kiểm tra nhân viên được gán.
2. Nếu Taxi, xác nhận xe nhận chuyến và bàn giao khi đến thật; lịch thường không có Taxi bỏ qua bước này.
3. Admin chọn **Bắt đầu dịch vụ**, nhập ghi chú 3+ ký tự; kiểm tra trạng thái Đang thực hiện.
4. Admin chọn **Hoàn tất dịch vụ** sau khi bàn giao, nhập ghi chú 3+ ký tự; kiểm tra trạng thái Hoàn tất. Không có ô tải ảnh.
5. Đặt đơn mua lẻ, xác nhận đơn, chuẩn bị; nhận tại quầy hoặc vận chuyển và xác nhận giao; đối soát thanh toán riêng.
6. Kiểm thử tiền mặt và chuyển khoản mô phỏng. `PETDAY_DEMO_PAYMENT=true` trong server/.env.

## Không thay đổi dữ liệu
Không cần migration SQL mới cho V6.69. Sao chép `.env` từ bản đang chạy. **Không chạy lại các migration cũ**.

## Giới hạn
Đã kiểm thử bằng bộ test source, chưa chạy End-to-end với PostgreSQL của người dùng. Không khẳng định tính đúng đắn của giao dịch trên máy người dùng trước nghiệm thu.

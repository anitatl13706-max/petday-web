# PetDay V6.101 — QR gọn và Pet Taxi 1/2 chiều

## Những thay đổi đã đưa vào SOURCE
- Tại **Thanh toán lịch hẹn**: bỏ bảng thông tin nhận/chuyển khoản lặp và form ngân hàng/tên người gửi; một thẻ QR hiển thị số tiền, mã lịch, đếm ngược 15 phút, nút báo **Tôi đã chuyển khoản**. Hệ thống chỉ lưu *báo chuyển khoản thử nghiệm*, Admin phải đối soát/xác nhận riêng. QR KHÔNG chứa thông tin ngân hàng và KHÔNG chuyển tiền thật.
- Đặt dịch vụ: Pet Taxi có **Đón đến / Đưa về / Hai chiều**, có địa chỉ đón và địa chỉ về (có thể khác nhau), phí vùng cố định 1 lần hoặc 2 lần. Chỉ là ước tính vùng; không tự định vị hay tính km thật.
- Backend kiểm tra và lưu chiều vận chuyển, chi phí, địa chỉ về; riêng chiều về phải được xác nhận hoàn tất trước khi đánh dấu lịch chăm sóc hoàn tất. Admin có thao tác xác nhận đón, sau đó xác nhận trả riêng với chuyến hai chiều.
- Sửa hook lấy **địa chỉ mặc định** cho cửa hàng: đưa từ AdminServicePrices về StandaloneRetailShop.

## Migration — CHỈ PostgreSQL local/test
1. Sao lưu database `petday` trước khi sửa. Đừng chạy trên Neon online.
2. V6.99 cần SQL `048_v698_phone_daycare.sql` và `049_v699_payment_qr_sessions.sql`. Kiểm tra trước xem đã chạy chưa; không chạy lại nếu có thay đổi dữ liệu không rõ.
3. Chạy **`database/050_v6101_taxi_two_way.sql`** trong pgAdmin, database `petday` ở `PostgreSQL 17`.
4. Truy cập `http://localhost:4000/api/health/schema` để xem cột thiếu.

## Thao tác chạy
- Mở trực tiếp thư mục `PETDAY_OFFICIAL`, chép `server/.env` từ bản local cũ (không chia sẻ/đẩy Git).
- Backend: `cd server`, `npm install`, `npm start`.
- Frontend (terminal riêng, tại `PETDAY_OFFICIAL`): `npm install`, `npm run dev`.
- Nếu cổng 4000 đang dùng, dừng backend cũ bằng `Ctrl+C` ở terminal cũ.

## Test cases cần chạy trên localhost
- **QR-01** Lịch chuyển khoản chưa thanh toán: hiện 1 thẻ QR + số tiền + countdown. Không có form ngân hàng/tên người gửi.
- **QR-02** Báo đã chuyển trong vòng 15 phút: nhân viên thấy yêu cầu; thanh toán vẫn CHƯA thanh toán cho đến khi Admin xác nhận.
- **QR-03** QR hết 15 phút: nút gửi bị khóa và tạo lại phiên, không tự duyệt tiền.
- **TAXI-01** Chọn 1 chiều đón: phí một lượt, dữ liệu lưu direction=pickup.
- **TAXI-02** Chọn 1 chiều về: phí một lượt, check-in không cần trạng thái Taxi chiều đón; phải xác nhận bàn giao về trước khi kết thúc dịch vụ.
- **TAXI-03** Chọn 2 chiều: phí hai lượt, lưu địa chỉ về khác địa chỉ đón, Admin xác nhận đón đến và trả về riêng.
- **TAXI-04** Nhập địa chỉ sai/thiếu hoặc số điện thoại sai: backend phải từ chối.
- **TAXI-05** Không được đánh dấu hoàn tất dịch vụ có Taxi chiều về khi chưa có bàn giao chiều về.
- **ADDR-01** Địa chỉ mặc định tự điền trong mua hàng, sửa theo đơn không ghi đè hồ sơ.

## Các giới hạn và phần CHƯA hoàn thành của bộ BR 2.0
- Không tuyên bố đã triển khai toàn bộ BR/chính sách gốc: OTP điện thoại xác thực thật/giả lập có bảo mật, lịch lưu trú qua đêm/nhiều ngày, đặt cọc tự động theo lịch sử, một giao dịch thanh toán nhiều lịch, và một số điều kiện đổi/hủy/hoàn tiền vẫn cần đối chiếu/triển khai riêng.
- QR là **tham chiếu mô phỏng**, KHÔNG phải VietQR/ngân hàng thật. Phí Pet Taxi dựa trên vùng, không khẳng định đo chính xác khoảng cách 2 km/20 km.
- Chưa chạy được build frontend hoàn chỉnh tại môi trường đóng gói do thư viện npm không được tải ngoại tuyến. Các file TSX đã qua kiểm tra cú pháp với TypeScript transpiler, JS backend qua `node --check` và báo giá Taxi qua kiểm thử unit. Cần `npm run build` và kiểm thử E2E trên máy Windows trước khi deploy.

# PetDay v5 — tích hợp trải nghiệm tài khoản, tư vấn và ảnh thú cưng

## Đã thay đổi
- Thay hai nút tài khoản trùng bằng một menu có Tài khoản, Thú cưng, Lịch hẹn, Quản trị (chỉ Admin), Đăng xuất.
- Form yêu cầu nhân viên tự điền tên/email từ tài khoản đăng nhập, vẫn cho chỉnh sửa.
- Upload ảnh JPG/PNG/WebP tối đa 2 MB, qua API có JWT, kiểm tra chữ ký file, lưu tệp trong `server/uploads`, lưu URL trong cột `pets.photo_url` khi nhấn Lưu hồ sơ.
- Booking/API v4 được giữ nguyên; chưa được bổ sung add-on/Pet Taxi thật.

## Database quan trọng
- **Tên cột backend dùng là `photo_url`, KHÔNG phải `image_url`**. Migration `003_support_pets.sql` đã thêm `photo_url`; không cần thêm `image_url`. Kiểm tra: `SELECT column_name FROM information_schema.columns WHERE table_name='pets' AND column_name IN ('photo_url','image_url');`
- Cần bảng consultation_requests. Không chạy lại migration khởi tạo nếu v4 đang hoạt động.

## Chạy
1. Giữ lại v4 làm bản dự phòng. Giải nén v5; copy `server/.env` từ v4 sang v5 (không chia sẻ file này).
2. Dừng các tiến trình v4 trên cổng 4000 và 8443 nếu có. Backend: vào thư mục `server`, chạy `npm install`, `npm run dev`.
3. Frontend: vào thư mục gốc có `package.json`, chạy `npm install`, `npm run dev -- --port 8444` (hoặc dùng cổng còn trống phù hợp cấu hình).
4. Đăng nhập → Tài khoản → Sửa hồ sơ Bông → Tải ảnh → Lưu thay đổi → Làm mới và kiểm tra ảnh còn.
5. Vào Nhân viên tư vấn: kiểm tra tên/email được điền sẵn; gửi yêu cầu giả → Admin xem yêu cầu.

## Chưa hoàn thành, không được ghi là đã hoàn thành trong báo cáo
- Quên mật khẩu bằng email/token: cần email SMTP/provider; không nên cung cấp luồng giả hoặc lộ token reset trong trang.
- Trợ lý chỉ theo kịch bản, chưa kết nối mô hình AI.
- Chưa kết nối Pet Taxi/add-on/đổi lịch/thanh toán online thật.
- Chưa kiểm thử end-to-end với PostgreSQL của máy người dùng.
- Upload local disk phù hợp demo localhost; production cần object storage, quét file, giới hạn truy cập, dọn ảnh rác và bảo vệ dữ liệu.
- Header hiện dựa vào /api/me và cần refresh sau đăng nhập để cập nhật tên (từ trang account bấm qua trang khác sẽ tải lại).

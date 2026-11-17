# PetDay — Bản thử nghiệm tự động hóa nghiệp vụ (chưa triển khai Production)

## Các cập nhật
- Đăng nhập thành công điều hướng về trang chủ.
- 4 khung bắt đầu 08:30, 10:00, 13:30, 15:00 cho Grooming/Spa; mỗi khung hiển thị 90 phút. Giờ hoạt động chung 08:00–20:00 **không có nghĩa tất cả 12 giờ đều mở đặt Grooming/Spa**.
- Canh hàng hai lựa chọn thanh toán, hiển thị lưu ý về cọc 20% khách lần đầu.
- Báo giá và kiểm soát cọc lần đầu 20% tại backend; cả người chọn tiền mặt cũng phải chuyển khoản phần cọc. Phần còn lại vẫn theo phương thức khách chọn.
- Hủy lịch và đổi lịch khách hàng được hệ thống tự chấp thuận đối với các lịch đơn giản, còn đủ điều kiện, sau khi backend kiểm tra quyền, thời gian, công suất và Taxi; những ngoại lệ vẫn cần PetDay xử lý.
- Hoàn tiền đủ điều kiện được **tự động duyệt hồ sơ**, nhưng không tự xác nhận tiền đã được chuyển trả.
- Daycare: khách chọn giờ đến/giờ về trong 08:00–20:00, giá tính theo thời gian, có thể bổ sung duy nhất 1 gói Grooming hoặc Spa đủ điều kiện.
- Ba thẻ Cẩm nang có bài viết nội dung chi tiết, bấm ảnh/tiêu đề/nút đều mở được.
- Lược bỏ/điều chỉnh một số ghi chú UI không còn phù hợp.

## Giới hạn bắt buộc
- **CHƯA TỰ XÁC NHẬN CHUYỂN KHOẢN NGÂN HÀNG THẬT**: hệ thống hiện chỉ có QR/hình thức thông báo thanh toán và đối soát; cần kết nối API/webhook từ ngân hàng hoặc nhà cung cấp thanh toán có xác minh chữ ký và chống xử lý trùng trước khi bật tự động.
- **CHƯA TỰ CHUYỂN TIỀN HOÀN**: tự động xét duyệt số tiền không có nghĩa giao dịch hoàn tiền đã hoàn tất; cần nhà cung cấp payout/refund thật. Tuyệt đối không giả trạng thái đã nhận/đã hoàn.
- Daycare đang không hỗ trợ tự đổi lịch với thời lượng mới; cần thao tác xử lý riêng để không thay đổi số giờ/phí sai.
- Cọc 20% không tự trừ tiền trực tiếp từ tài khoản khách; cần xác nhận ngân hàng/biên nhận hợp lệ. Không xác nhận đã thu khi khách chỉ nhấn nút.
- Đoạn mã được kiểm thử bằng bộ test backend và kiểm tra cú pháp TSX, **chưa chạy nghiệm thu tích hợp frontend + Neon + Render + Vercel trên staging**.
- Không ghi đè ngay website đang online; hãy backup DB, cài dependencies, chạy `npm run build` tại root và `npm test` trong `server`, test E2E trên staging trước khi merge production.
- Đổi mật khẩu Neon đã từng được chia sẻ trước khi kết nối môi trường thật.

## Kiểm thử đã thực hiện
- `node --test server/test/*.test.js`: 285 đạt, 0 lỗi.
- `node --check server/src/server.js`: đạt.
- TypeScript TSX syntax parser các file frontend chính: đạt. Full Vite build chưa được thực hiện vì môi trường này thiếu package cache.

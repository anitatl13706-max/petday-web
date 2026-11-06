# PetDay V6.5 — Tổng hợp nâng cấp & đường đi nghiệp vụ

## Đã cập nhật trong mã
- Backend ảnh dùng đường dẫn chuẩn Windows (`fileURLToPath`), không dùng pathname URL làm đường dẫn hệ điều hành.
- `PATCH /api/me`: sửa tên thật của người đang đăng nhập (không cho đổi role).
- `GET /api/quote`: báo giá từ backend theo loài, cân nặng và dịch vụ của đúng chủ thú cưng. Giá được kiểm tra lại khi đặt lịch.
- `GET /api/payment/options`: chỉ hiển thị thông tin ngân hàng khi được người vận hành cấu hình; mặc định tiền mặt.
- Từ chối booking chuyển khoản nếu chưa có tài khoản nhận tiền được cấu hình. Không giả nhận thanh toán.
- Bước chọn dịch vụ hiển thị các dòng tính giá theo kết quả API.

## Luồng phải kiểm thử trước nộp
1. Đăng ký/đăng nhập: thông báo lỗi, phân quyền, thông tin cá nhân; đặt lại mật khẩu qua SMTP (lưu ý xác thực token một lần).
2. Pet Profile: chọn file, POST ảnh, PUT hồ sơ, GET hồ sơ, GET URL ảnh, thử tải lại trang; xóa ảnh phải cập nhật DB.
3. Booking: pet hợp lệ → dịch vụ phù hợp → báo giá backend → kiểm tra công suất → tạo lịch idempotent → xác nhận Admin → chăm sóc → hoàn tất → đánh giá.
4. Đổi lịch: khách đề nghị → Admin kiểm tra lại công suất trong transaction → phê duyệt hoặc từ chối → khách xem kết quả; lịch cũ còn hiệu lực trong lúc chờ.
5. Tiền mặt: booking chưa thu tiền → nhân viên thu tại quầy → Admin đối chiếu và ghi nhận; có lịch sử ghi nhận là tính năng còn phải xây dựng.
6. Chuyển khoản: chỉ bật khi ngân hàng thật được cấu hình; số tiền + mã lịch → ngân hàng → chứng từ/đối soát → Admin xác nhận → trạng thái thanh toán. Chưa có QR, upload chứng từ, audit-log, IPN. Không coi là hoàn chỉnh.
7. VNPAY: chỉ xem là hoàn tất sau khi có sandbox merchant credentials, ký URL, xác minh IPN/checksum, idempotency, lưu transaction và xử lý thất bại/hoàn tiền.
8. Chatbot: trả lời FAQ bằng kịch bản → chuyển phiếu tư vấn → nhân viên trả lời → khách xem lịch sử; không quảng cáo chatbot theo luật là AI tạo sinh.
9. Quản trị: role-based access, dịch vụ, giá, slot, nhân viên, khách, yêu cầu hỗ trợ, đối soát, báo cáo KPI.
10. Nhắc lịch: scheduler lưu job/outbox → gửi email có trạng thái và retry → không gửi trùng.

## Trạng thái hiện tại
V6.5 KHÔNG khẳng định 35 tính năng đã chạy đầy đủ. Các hạng mục add-on, Pet Taxi, checkout mua kèm, QR/VNPAY, SMTP production, refund, audit log và reminder scheduler còn phải triển khai và test.

## Bảo mật
Không đẩy `.env` lên Git, không chia sẻ mật khẩu, khóa JWT, SMTP App Password, API key. Nếu bí mật từng được đưa lên chat, nên thay mới.

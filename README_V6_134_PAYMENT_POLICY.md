# PetDay V6.134 – Chính sách thanh toán trước

- Khách thuộc diện bắt buộc đặt cọc: chọn **tiền mặt** có 2 lựa chọn lúc đặt lịch: **cọc 20% phí chăm sóc** (trả phần còn lại bằng tiền mặt) hoặc **thanh toán toàn bộ qua QR**.
- Chọn **chuyển khoản** (mọi khách) bắt buộc **100% qua QR**, không có cọc 20%.
- Backend lưu `payment_plan`: DEPOSIT_20/FULL_PREPAY/PAY_LATER và khóa lựa chọn theo mã lịch.
- Chưa nhận đủ số tiền bắt buộc: lịch `Đang chờ xác nhận`, không thể tiếp nhận pet và bắt đầu dịch vụ.
- Không có migration mới (dùng cột `payment_plan` từ SQL 062).
- Chế độ `PETDAY_DEMO_PAYMENT=true` chỉ mô phỏng, không xác minh giao dịch ngân hàng. Không dùng trong vận hành thực tế.
- Kiểm tra trên database TEST, giữ nguyên `.env` cũ và không đưa bí mật vào ZIP.

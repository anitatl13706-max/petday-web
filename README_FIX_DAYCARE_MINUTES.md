# PetDay V6.106.2 — Fix Daycare giờ phút

Sửa đồng bộ frontend và backend: cho phép chọn phút bất kỳ từ 08:00 đến 20:00; giờ đến nhỏ hơn 20:00, cùng ngày cần ít nhất 60 phút. Giá tính theo phút thực tế với đơn giá 40.000đ/giờ, làm tròn đến VND. Ví dụ 09:00–13:34 = 274 phút = 182.667đ.

Chạy frontend: cd PETDAY_OFFICIAL; npm install; npm run dev.
Backend: cd PETDAY_OFFICIAL/server; npm install; npm start. Dùng DB test, không dùng Production. Kiểm tra đúng port hiển thị; frontend/backend phải trỏ cùng cổng.

Không tự xác nhận chuyển khoản hoặc tiền hoàn nếu chưa có xác thực giao dịch thật.

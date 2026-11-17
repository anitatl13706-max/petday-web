PETDAY V6.122 — ĐỔI LỊCH 1 GIỜ + PET TAXI ADMIN + CĂN NÚT

1. KHÁCH HÀNG
- Trước hơn 1 giờ so với giờ bắt đầu: đổi tự động nếu đủ điều kiện và còn khung giờ.
- Đúng 1 giờ hoặc dưới 1 giờ: không tự động; có thể gửi yêu cầu nhân viên hỗ trợ khi chưa qua giờ hẹn.
- Đã qua giờ bắt đầu: không gửi thao tác trực tuyến, liên hệ PetDay.
- Lịch đã tự đổi trước đó vẫn có thể đổi lại nếu còn thỏa điều kiện; lịch sử được lưu lại.
- Khi chuyển sang tab đổi lịch bằng nút trên thẻ, trang cuộn đến đúng khu vực.
- Taxi đã khởi hành/hoàn thành: chặn đổi lịch tự động để tránh lệch chuyến.

2. ADMIN
- Trong Quản trị > Lịch hẹn: có thêm khu vực Pet Taxi, mỗi lịch chứa Taxi mở được panel từng chiều (tái sử dụng API hiện hữu).
- Trên thẻ lịch có nút Đổi lịch; Admin chọn ngày/giờ, nhập lý do ít nhất 5 ký tự.
- Backend kiểm tra khung giờ trống, trùng lịch thú cưng, taxi đã hoạt động trước khi cập nhật. Không cần duyệt từ khách.
- Nhãn trạng thái và nút ở đầu thẻ được xếp hàng nhất quán.

3. CHẠY LOCAL TRÊN WINDOWS (2 TERMINAL)
Terminal frontend: cd PETDAY_OFFICIAL ; npm install ; npm run dev
Terminal backend: cd PETDAY_OFFICIAL/server ; npm install ; $env:PORT='4001'; npm start
File server/.env phải kết nối PostgreSQL TEST đã được cấu hình từ trước.
Không có migration SQL mới; sử dụng database đã nâng cấp cho V6.121.

4. ĐÃ KIỂM THỬ
- node --test server/test/*.test.js: 328/328 PASS.
- Node --check backend: PASS.
- TypeScript transpile syntax TSX: 0 lỗi cú pháp.
- Chưa build frontend bằng Vite hoặc kiểm thử với PostgreSQL thật trong môi trường này (thiếu dependencies frontend).

5. THỬ NGHIỆM
- Tạo lịch trong tương lai >1h, đổi sang giờ còn trống -> lịch tự cập nhật.
- Đổi lần 2 nếu lịch còn điều kiện -> thành công; lịch sử không xóa.
- Đúng 1h -> tạo yêu cầu hỗ trợ, không tự đổi.
- Đã qua giờ -> hướng dẫn liên hệ nhân viên.
- Admin đổi trực tiếp, ghi lý do, kiểm tra lại lịch mới và Taxi.
- Admin > Lịch hẹn > Pet Taxi: thấy và mở được từng lịch có Taxi.

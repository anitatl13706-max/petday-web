# PetDay V6.24 — Khung giờ trống theo ngày & cải thiện trải nghiệm đặt lịch

## Mục tiêu và nguồn tham khảo
- Tập trung bước chọn giờ: lịch trống, giờ đã kín, giờ tạm khóa cùng một màn hình.
- Giữ đúng hướng mô hình vận hành từ V6.23: không tạo thêm menu, dùng cùng bảng bookings và blocked_slots.
- Các hệ thống chuyên ngành như MoeGo tập trung vào đặt lịch, năng lực nhận lịch, phân công nhân viên và đặt lại lịch (https://www.moego.pet/scheduling); PetDay chỉ vận dụng nguyên tắc IA/UX, không sao chép giao diện.

## Phạm vi code đã sửa
- API GET /api/availability/day?branch=...&date=YYYY-MM-DD&service=... yêu cầu đăng nhập. Trả về từng giờ hợp lệ, remaining, available, reason. Chỉ thực hiện SELECT; không ghi booking.
- src/Portal.tsx bước 3 hiển thị nút giờ chọn được, nút giờ đã đầy/tạm khóa bị vô hiệu hóa. Khi đổi ngày/chi nhánh/dịch vụ, dữ liệu được tải lại; request cũ không ghi đè request mới.
- Nút tiếp tục chỉ kích hoạt khi đã có giờ đang được báo còn chỗ. Máy chủ vẫn kiểm tra công suất và khóa giao dịch khi khách đặt.
- Thêm 6 unit tests cho tính chỗ còn lại, giờ hợp lệ, giờ tạm khóa.
- Không cần migration vì tái sử dụng bookings và blocked_slots. Database phải có đủ SQL đến 018.

## Cần tự kiểm thử end-to-end
1. Admin khóa giờ trống 10:00. Khách mở ngày/chi nhánh tương ứng, thấy 10:00 Tạm khóa và không thể chọn.
2. Tạo đủ lịch vào một giờ. Khách mở lại trang, thấy giờ Đã đầy.
3. Đổi qua ngày khác, bảng giờ cập nhật mà không làm thay đổi các booking cũ.
4. Daycare chỉ hiện giờ sáng; Spa không có 17:30.
5. Đặt cùng một slot từ hai tài khoản cùng lúc; một booking bị chặn nếu không đủ công suất.
6. Thanh toán vẫn chọn tiền mặt hoặc chuyển khoản; chuyển khoản cần ngân hàng được cấu hình.
7. Kiểm thử desktop/mobile, lỗi mạng, tài khoản Customer, Admin, Staff và trạng thái session hết hạn.

## Phạm vi chưa hoàn thiện
- Chưa có frontend production build trong môi trường đóng gói do chưa có gói npm đã cài; 53 unit test backend và kiểm tra cú pháp không thay thế E2E.
- Bảng ngày không khóa/giữ slot trước khi xác nhận; backend là nguồn quyết định cuối cùng.
- Chưa có thanh toán ngân hàng tự động hoặc chứng nhận khả năng xử lý thực tế toàn bộ các luồng.

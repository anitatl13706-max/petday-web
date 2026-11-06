# PetDay V6.2 – Luồng yêu cầu đổi lịch

Bản này kế thừa source PetDay V6 đã khôi phục, kèm giao diện Booking V6.1. Thay đổi thực thi được:

- Khách hàng có thể đề nghị ngày/giờ mới cho lịch đang chờ xác nhận hoặc đã xác nhận, ghi lý do.
- API từ chối lịch không thuộc khách, ngày quá khứ, giờ không phù hợp, lịch đã bắt đầu và yêu cầu trùng đang chờ.
- Lịch ban đầu không bị thay đổi khi khách gửi yêu cầu.
- Admin tải yêu cầu, duyệt hoặc từ chối. Khi duyệt, backend kiểm tra lại ngày tương lai, tính sức chứa trong giao dịch và sử dụng advisory transaction lock cùng cơ chế đặt lịch hiện có. Nếu hết chỗ, không duyệt và không sửa giờ.
- Khách xem trạng thái yêu cầu qua API và nút Tải yêu cầu trong Lịch hẹn của tôi.

## Nâng cấp database (bắt buộc chỉ MỘT lần)

1. Sao lưu database `petday` trong pgAdmin.
2. Chạy **duy nhất** `database/006_reschedule_requests.sql` (không chạy lại 001-005).
3. Kiểm tra `SELECT to_regclass('public.booking_reschedule_requests');` trả về tên bảng.

## Chạy

Sử dụng `server/.env` đang hoạt động từ bản trước. KHÔNG gửi hay commit `.env`.
Backend: `cd server; npm install; npm run dev`.
Frontend: `npm install; npm run dev` từ thư mục PETDAY_OFFICIAL.

## Kiểm thử đề xuất

1. Đăng nhập khách, tạo lịch trong tương lai, mở Lịch hẹn của tôi, chọn ngày/giờ mới, nhập lý do, Gửi yêu cầu.
2. Tải yêu cầu, thấy `Chờ duyệt`. Lịch ban đầu vẫn giữ nguyên.
3. Thử gửi yêu cầu thứ hai: nhận lỗi 409.
4. Đăng nhập Admin, vào Quản trị, Tải yêu cầu và duyệt. Lịch được cập nhật, yêu cầu = Đã duyệt.
5. Thử lịch hết chỗ hoặc ngày đã qua trước khi duyệt: phải từ chối và không đổi lịch.
6. Thử khách khác xem hoặc gửi yêu cầu cho lịch không thuộc mình: bị từ chối.

## Giới hạn chưa hoàn tất

Bản này mới hoàn thiện quy trình **đề nghị đổi lịch/duyệt đổi lịch**; chưa triển khai các dịch vụ bổ sung, Pet Taxi, nhắc lịch, thanh toán đối soát tự động, dashboard KPI tổng hợp và chatbot AI tạo sinh. Backend/frontend chưa được thử E2E trên PostgreSQL máy người dùng. Chức năng SMTP quên mật khẩu vẫn đòi hỏi cấu hình nhà cung cấp email hợp lệ. Các quy tắc công suất hiện dựa trên `slots` cố định trong rules.js, chưa thay bằng lịch nhân viên thực.

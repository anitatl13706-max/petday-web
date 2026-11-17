# Ảnh thật trong nhật ký chăm sóc

## Cài đặt local

1. Sao lưu database `petday`.
2. Chạy duy nhất migration mới `database/065_v6130_care_event_images.sql` trên database hiện tại. Không chạy lại các migration cũ.
3. Khởi động backend bằng tài khoản hệ điều hành có quyền ghi trong thư mục `server/`.

Backend tự tạo thư mục riêng `server/private_uploads/care-events/` ở lần tải ảnh đầu tiên. Không cấu hình thư mục này thành static/public và không đưa file bên trong vào Git. Khi chuyển máy hoặc sao lưu, cần sao chép cả database lẫn thư mục `server/private_uploads/` để giữ ảnh.

## Giới hạn và quyền

- JPG, PNG, WebP; tối đa 5 MB mỗi ảnh và 5 ảnh cho một sự kiện.
- Backend kiểm tra MIME và chữ ký nội dung file, tự sinh khóa lưu trữ và không dùng đường dẫn do trình duyệt gửi lên.
- Admin hoặc nhân viên đang được phân công mới được tải ảnh.
- Chủ lịch, Admin hoặc nhân viên đang được phân công mới lấy được nội dung ảnh qua API có Bearer token.
- Ảnh là tùy chọn. Việc không chọn ảnh không chặn cập nhật nhật ký hoặc chuyển trạng thái hợp lệ.

## Kiểm tra nhanh

Chạy `npm.cmd run build` và `npm.cmd run check:syntax` tại thư mục gốc; chạy `npm.cmd test` trong `server/`. API schema doctor sẽ báo thiếu bảng `care_event_images` nếu migration 065 chưa được áp dụng.

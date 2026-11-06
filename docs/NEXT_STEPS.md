# PetDay — Khởi động phát triển từ source Figma Make (02/11/2026)

## Đã có
- Toàn bộ source React/TypeScript được trích nguyên bản từ ZIP do người dùng gửi.
- File database/001_booking_foundation.sql là **khung database mới đề xuất**, chưa chạy hay kết nối frontend.
- Code Figma hiện quản lý booking bằng browser localStorage, chưa có server/backend thực tế.

## Chạy giao diện trên Windows
1. Cài Node.js 22+ nếu máy chưa có.
2. Giải nén thư mục, mở thư mục này trong VS Code.
3. Mở Terminal chạy `npm install`, sau đó `npm run dev`.
4. Mở URL localhost được Terminal in ra (thường http://localhost:5173).
5. Nếu có lỗi `vite` hoặc package peer deps, chụp toàn bộ Terminal trước khi sửa package.json.

## Thứ tự triển khai tiếp
1. Xác minh chạy bản frontend gốc và chụp trang Home/Booking/Admin.
2. Chốt Booking contract: pending → confirmed → in_progress → completed; cancelled chỉ từ pending/confirmed.
3. Tạo Express API, PostgreSQL và migration được kiểm soát; xác thực + role.
4. Lưu Pet Profile và Booking vào database; server kiểm tra giá, slot/capacity và idempotency.
5. Chuyển Booking/Admin khỏi localStorage; kiểm thử 2 trình duyệt, chủ sở hữu, trạng thái và review.
6. Cập nhật Feature Master, mockup Figma Design, BPMN/Use Case/ERD/test/report theo code đã xác thực.

## Lưu ý an toàn
- Đây không phải một backend hoạt động; không nhập dữ liệu khách hàng thật vào demo.
- Không lưu secrets vào repository; sử dụng .env và .gitignore.
- Không tự chạy SQL này lên database có dữ liệu thật.

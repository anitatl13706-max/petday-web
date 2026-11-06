# PetDay V6.44.1 — null role crash hotfix

## Lỗi đã tìm thấy
Khi mở trang trước lúc xác thực tài khoản, `user` có thể là `null`.
Trong `src/Portal.tsx`, `<StandaloneRetailShop>` nằm **ngoài** nhánh JSX dành cho người dùng đã đăng nhập nhưng kiểm tra trực tiếp `user.role`.
Điều này làm React ném `Cannot read properties of null (reading 'role')` và hiển thị màn hình khôi phục.

## Thay đổi
Thay `view==='account'&&user.role==='customer'` tại biểu thức `StandaloneRetailShop` thành `view==='account'&&user?.role==='customer'`.
Thêm `npm run check:auth-guard` để kiểm tra phòng ngừa lỗi này.

## Cài đặt an toàn
- Không có migration SQL mới, giữ database petday hiện tại, **không chạy lại 001–026**.
- Sao chép `server/.env` từ bản đang hoạt động, giữ bí mật các biến môi trường.
- Dừng frontend/backend cũ trước khi chạy bản mới.
- Backend: `cd PETDAY_OFFICIAL/server && npm install && npm test && npm run verify:release && npm run dev`.
- Frontend: `cd PETDAY_OFFICIAL && npm install && npm run check:syntax && npm run check:auth-guard && npm run build && npm run dev`.
- Kiểm tra `http://localhost:8443/#tai-khoan` khi chưa đăng nhập: phải thấy form đăng nhập.
- Đăng nhập Customer: phải thấy trang Tài khoản và mục mua sản phẩm riêng; logout không crash.
- Đăng nhập Admin: phải thấy khu vực Admin, không hiện shop khách hàng.

## Giới hạn xác minh
Hotfix tập trung vào lỗi null role đã được xác định chính xác từ màn hình. Cần build và chạy E2E trên máy người dùng để xác nhận tất cả luồng nghiệp vụ. Không thay đổi thanh toán, dữ liệu và SQL.

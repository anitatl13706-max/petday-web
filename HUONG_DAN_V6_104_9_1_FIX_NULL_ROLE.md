# PetDay V6.104.9.1 — Sửa lỗi trang Lịch hẹn khi `user` là `null`

## Nguyên nhân
Trong `src/Portal.tsx`, khối `requestPanels` chứa các JSX condition `user.role === 'customer'`. Khối JSX này có thể được dựng khi người dùng chưa tải xong phiên đăng nhập hoặc chưa đăng nhập (`user === null`), làm React Error Boundary báo `Cannot read properties of null (reading 'role')`.

## Sửa lỗi
Đổi đúng hai lần đọc `user.role` trong `requestPanels` thành `user?.role`. Không thay đổi dữ liệu, API, chính sách Pet Taxi, phân quyền server, hay cấu trúc PostgreSQL.

## Khởi động
1. Giải nén ZIP; chép `PETDAY_OFFICIAL/server/.env` từ bản V6.104.9 đã chạy trước đó, nếu cần.
2. Terminal backend: `cd PETDAY_OFFICIAL/server` rồi `npm install` (nếu chưa có `node_modules`), `npm start`.
3. Terminal frontend: `cd PETDAY_OFFICIAL` rồi `npm install` (nếu chưa có `node_modules`), `npm run dev`.
4. Mở localhost do Vite hiển thị và F5 hoặc Ctrl+Shift+R. Không chạy migration SQL mới.

## Kiểm thử trọng tâm
- Chưa đăng nhập: mở `/#lich-hen`, thấy màn đăng nhập, không còn màn lỗi `null (reading 'role')`.
- Đăng nhập Customer: mở `Lịch hẹn`, thấy danh sách và phần yêu cầu đổi lịch.
- Đăng nhập Admin: mở `Lịch hẹn`, thấy các yêu cầu cần duyệt; không có lỗi giao diện.
- Sau F5 vẫn tải được trang. Không cần kiểm thử lại nghiệp vụ Taxi và hoàn tiền chỉ vì bản vá này.

## Kết quả kiểm tra trong môi trường tạo bản vá
- `Portal.tsx` được phân tích cú pháp TSX bằng TypeScript toàn cục: đạt.
- `node --check server/src/server.js`: đạt.
- `node scripts/check-auth-guard.mjs`: đạt.
- Chưa xác nhận build frontend đầy đủ hay đăng nhập E2E với PostgreSQL trên máy người dùng.

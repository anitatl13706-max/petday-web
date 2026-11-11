# PetDay V6.102 — Kiểm soát xác nhận thanh toán và duyệt lịch

Nguồn: V6.101. Phạm vi sửa: `server/src/server.js`, `src/FinanceWorkbench.tsx`, `src/Portal.tsx`.

- Đối với lịch chọn chuyển khoản mô phỏng: API `PATCH /api/admin/bookings/:code/payment` chỉ cho đánh dấu đã thu khi đã có thông báo khách hàng (bank_transfer_notices) và `payment_qr_sessions.reported_at` hợp lệ. Kiểm tra được thực hiện trong giao dịch PostgreSQL trước khi update.
- API `/api/admin/transfer-notices` trả các thông báo đã gửi từ phiên QR hợp lệ, không dựa vào việc Admin tự nhập mã.
- Sổ thu tiền Admin khóa nút đối soát chuyển khoản khi chưa có thông báo; có nút tải lại danh sách thông báo. Thu tiền mặt vẫn giữ nguyên.
- Trong Lịch hẹn Admin, với lịch chuyển khoản chưa đối soát, nút Chuyển sang Đã xác nhận bị khóa và có giải thích điều kiện.
- Luồng QR khách gửi thông báo, Admin xác nhận thu tiền, duyệt lịch giữ nguyên; `payment_status` tách biệt `status`.

## Cách cập nhật localhost

1. Giải nén và mở `PETDAY_OFFICIAL`; chép `server/.env` của bản V6.101 sang bản mới **chỉ trên máy cá nhân**. Không commit/công khai `.env`.
2. Dừng backend/frontend V6.101 bằng Ctrl+C. Trong thư mục `PETDAY_OFFICIAL/server`, chạy `npm install` và `npm start`.
3. Mở Terminal thứ hai trong `PETDAY_OFFICIAL`, chạy `npm install` và `npm run dev`; mở URL localhost mà Vite in ra.
4. Bản V6.102 **không thêm migration mới**. Nhưng database local vẫn cần có các migration 048/049/050 từ các bản trước nếu đã sử dụng những tính năng đó.
5. Kiểm thử: (A) khách chưa bấm Tôi đã chuyển khoản -> Admin không thể xác nhận thu hay duyệt lịch; (B) khách bấm trong QR còn hiệu lực -> Admin tải lại thông báo -> đối soát -> duyệt lịch; (C) lịch trả tiền mặt -> thao tác ghi nhận tiền mặt độc lập; (D) admin gửi API trực tiếp thiếu thông báo -> HTTP 409.

## Xác minh

- Chạy `node --test server/test/*.test.js`: 196/196 test hiện có thành công.
- `node --check server/src/server.js`: đạt.
- Kiểm tra cú pháp TSX của `FinanceWorkbench.tsx` và `Portal.tsx`: đạt.
- Chưa kiểm thử end-to-end với PostgreSQL thực tế và chưa xác nhận frontend build production; không triển khai online trước khi kiểm thử trên máy.

# PetDay V6.104.8 — Tinh gọn thiết lập chuyển khoản và yêu cầu lịch hẹn

## Thay đổi UI
- Admin > Tài chính > Thiết lập: bỏ khung cảnh báo màu vàng lớn và các đoạn hướng dẫn kỹ thuật lặp lại. Khi thanh toán mô phỏng đang bật, vẫn có ghi chú nhỏ: không chuyển tiền thật. Không thay đổi điều kiện khóa nút Lưu ở chế độ mô phỏng.
- Admin > Lịch hẹn: đưa hai khu Duyệt yêu cầu hủy lịch và Duyệt yêu cầu đổi lịch lên trước danh sách lịch, độc lập với lọc trạng thái lịch. Hiển thị số yêu cầu chờ duyệt. Khi không có yêu cầu, chỉ hiển thị thông báo ngắn.
- Admin > Yêu cầu: chỉ hiển thị các yêu cầu hủy chờ xử lý; đổi lịch đang chờ hoặc đã duyệt cần đồng bộ giờ. Lịch sử đã giải quyết giữ trong cơ sở dữ liệu, không bị xóa.
- Customer: giữ luồng gửi yêu cầu đổi/hủy ở khu Lịch của tôi, không thay đổi nghiệp vụ.

## Cài đặt
- Chạy bản mới sau khi sao chép `server/.env` từ V6.104.7.
- Backend: từ thư mục `PETDAY_OFFICIAL/server`, chạy `npm install` và `npm start`.
- Frontend: từ thư mục `PETDAY_OFFICIAL`, chạy `npm install` và `npm run dev`.
- Không có migration SQL mới.

## Smoke test giao diện
1. Tài chính > Thiết lập: không còn khung cảnh báo vàng lớn, vẫn có ghi chú mô phỏng nhỏ.
2. Lịch hẹn: Yêu cầu cần duyệt nằm trên danh sách lịch; bộ lọc Hoàn tất không làm mất yêu cầu chờ duyệt.
3. Duyệt yêu cầu: duyệt thử một yêu cầu đổi lịch và một yêu cầu hủy hợp lệ; số đếm giảm và trạng thái lịch cập nhật sau tải lại.
4. Customer: xem lịch, gửi yêu cầu; Admin thấy yêu cầu mới ở phía trên.

## Giới hạn kiểm thử
- 259/259 kiểm thử backend đạt.
- Đã kiểm tra cú pháp TypeScript/TSX; chưa chạy build Vite và E2E trên PostgreSQL máy người dùng.

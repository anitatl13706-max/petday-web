# PetDay V6.104.3 — Admin tinh gọn + rà soát tiền và Pet Taxi

## Giao diện Admin
- Tổng quan: bỏ cảnh báo "Chưa phân công nhân viên"; không yêu cầu phân công để Check-in/chăm sóc.
- Lịch hẹn: mặc định chỉ thấy việc đang xử lý. Các lịch hoàn tất và đã hủy/No-show vẫn tra cứu được bằng bộ lọc.
- Đơn hàng: chia Đang xử lý / Cần xử lý đặc biệt / Đã giao-hoàn tất / Đã hủy-trả hàng. Không xóa đơn.
- Tài chính: chia Cần xử lý / Đã thu-Đã hoàn / Thiết lập-Đối soát. Hồ sơ hoàn tiền đang chờ không chuyển sang lịch sử.

## Bất biến nghiệp vụ
- Lịch chăm sóc không thể bắt đầu nếu chưa Check-in.
- Taxi mỗi chiều quản lý riêng; hủy lịch hoặc No-show chỉ đóng chiều chưa xuất phát, không giả định hoàn tiền đã thực hiện.
- Hoàn dịch vụ giới hạn trong phần tiền chăm sóc, không cộng vào Taxi/hàng hóa.
- Hoàn Taxi giới hạn từng chiều, chỉ sau ghi nhận đã thu; tổng hồ sơ hoàn dịch vụ + Taxi không vượt tổng lịch đã thu.
- Tổng hợp hoàn dịch vụ + Taxi đã thực hiện được tính trong chỉ tiêu hoàn từ booking (không bao gồm hoàn đơn cửa hàng).
- Trạng thái hồ sơ: Chờ duyệt -> Đã duyệt/chờ hoàn -> Đã ghi nhận hoàn; ghi nhận hoàn không chuyển tiền tự động.

## Chạy localhost
1. Sao lưu database PostgreSQL local petday.
2. Giải nén, sao chép server/.env từ bản đang chạy (không chia sẻ file này).
3. Mở terminal tại PETDAY_OFFICIAL/server: `npm install` rồi `npm start`.
4. Mở terminal tại PETDAY_OFFICIAL: `npm install` rồi `npm run dev`.
5. Không có migration SQL mới trong bản cập nhật giao diện này; yêu cầu database đã cập nhật đến 053.

## Kiểm tra đã thực hiện ở môi trường đóng gói
- Node.js syntax check cho server.js và 33 file TS/TSX: đạt.
- 244 bài kiểm thử backend: đạt.
- Build Vite đầy đủ: CHƯA chạy được do môi trường tạo file không có Vite dependencies (vite: not found).
- E2E trên PostgreSQL local của người dùng: CHƯA chạy.

## Test tích hợp nên thực hiện
- Đăng nhập Admin, kiểm tra 4 màn mặc định; thử tab lịch sử.
- Một lịch không Taxi: duyệt -> Check-in -> chăm sóc -> hoàn tất.
- Taxi hai chiều, tự đưa pet đến, không gặp khách/No-show.
- Hoàn riêng tiền dịch vụ + Taxi; kiểm tra chống hoàn trùng và tổng tiền thực thu.
- Một đơn cửa hàng chuyển khoản và một đơn giao thành công.

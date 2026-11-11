# PetDay V6.104.9.2 — vá lỗi đổi lịch HTTP 404 và kiểm soát tiền Taxi

## Phạm vi
- Bổ sung API `POST /api/bookings/:code/reschedule` đã bị thiếu trong V6.104.9.1 (frontend đã gọi API này).
- Chỉ Customer sở hữu lịch được gửi yêu cầu; không được gửi khi lịch đã bắt đầu/chấm dứt, quá sát giờ (<=3 giờ), đã có yêu cầu pending/approved, hoặc Taxi đã xuất phát/đã kết thúc. Ngày giờ phải hợp lệ, khác lịch cũ. Chỉ INSERT vào bảng yêu cầu; Admin duyệt mới cập nhật lịch. Không thêm bảng/migration.
- Tính hoàn phí Taxi dựa vào biên nhận thực thu, không chỉ cờ `Đã thanh toán`. Nếu khách mới trả một phần mà vẫn trả dư so với phí điều chỉnh, hồ sơ hoàn không vượt phần trả dư thực tế. Không tạo hồ sơ hoàn khi chưa thực thu hoặc chưa có tiền dư.
- Trên API hoàn phí: có thể duyệt mức hoàn nhỏ hơn `refund_due` nếu tiền dư thực tế thấp hơn số phí được miễn; kiểm tra tổng hồ sơ hoàn dịch vụ + Taxi không vượt số thực thu, giữ các bước Pending → Approved → Completed và mã đối soát.
- Giữ nguyên policy 100% trước khi xe xuất phát, 50% sau khi xuất phát nhưng chưa đón pet theo xác minh, 0% với khách vắng mặt hợp lệ, 100% nếu lỗi PetDay.
- Không sửa cấu trúc hoặc dữ liệu database, không tạo hoặc thực hiện chuyển khoản thật.

## Cài đặt trên Windows
1. Sao lưu PostgreSQL local `petday`, giữ lại bản ZIP/phiên bản cũ.
2. Giải nén ZIP vào Downloads. Sao chép `PETDAY_OFFICIAL/server/.env` từ V6.104.9.1 đã dùng sang bản này. Không đưa `.env` lên Git/ChatGPT.
3. Đóng cả 2 terminal chạy PetDay cũ bằng Ctrl+C.
4. Terminal 1:
   ```powershell
   cd "C:\Users\Anita\Downloads\PetDay_V6_104_9_2_Fix_DoiLich_Taxi_HoanTien\PETDAY_OFFICIAL\server"
   npm install
   npm start
   ```
5. Terminal 2:
   ```powershell
   cd "C:\Users\Anita\Downloads\PetDay_V6_104_9_2_Fix_DoiLich_Taxi_HoanTien\PETDAY_OFFICIAL"
   npm install
   npm run dev
   ```
6. Mở địa chỉ localhost Vite thông báo. Kiểm tra `http://localhost:4000/api/health/schema`, dùng Ctrl+Shift+R tải lại trang.
7. Nếu trước đó database local đã chạy đầy đủ migration 051–055 thì **không cần chạy thêm SQL**.

## 5 bài test mục tiêu
1. **Đổi lịch Customer**: đặt lịch tương lai cách >3 giờ, gửi yêu cầu đổi ngày/giờ -> không 404, lịch cũ giữ nguyên; Admin duyệt -> ngày giờ mới cập nhật sau tải lại, Taxi chưa xuất phát chuyển về chờ điều phối lại.
2. **Admin đề xuất**: Admin gửi đề xuất -> Customer chấp thuận/từ chối; phía đề xuất không được tự duyệt.
3. **Hủy Taxi 50%, tiền mặt chưa thu**: chưa có biên nhận, khách hủy sau xe xuất phát, Admin xác minh pet chưa đón -> hóa đơn chỉ giảm phí; không tạo hồ sơ hoàn tiền.
4. **Hủy Taxi 50%, chuyển khoản đã thu**: Admin xác nhận biên nhận, khách hủy theo cùng quy tắc -> chỉ lập hồ sơ cho khoản tiền dư; duyệt -> xác nhận đã hoàn bằng mã đối soát, không hoàn lần thứ hai.
5. **Taxi hai chiều**: đón -> Check-in -> chăm sóc hoàn tất -> Taxi chiều về; khi chiều đón có sự cố, chiều về không tự hủy. Đã hủy/No-show phải đóng chiều chưa xuất phát.

## Kết quả kiểm tra trong môi trường đóng gói
- `node --test test/*.test.js`: 267/267 đạt.
- `node --check src/server.js`: đạt.
- `node scripts/check-syntax.mjs`: 35 file TypeScript/TSX đạt khi dùng bản TypeScript hệ thống.
- `node scripts/check-auth-guard.mjs`: đạt.
- **Chưa chạy build Vite đầy đủ / backend với database PostgreSQL local của người dùng**, vì môi trường này không có đầy đủ dependencies và `.env` tương ứng. Không tuyên bố E2E đã đạt.

## Nếu còn lỗi
Mở tab Network, tìm request màu đỏ; gửi HTTP status + Response (che token và thông tin nhạy cảm). Với lỗi backend, gửi log Terminal `npm start`. Không chạy lại migration hàng loạt.

# PetDay V6.129 — đồng bộ nghiệp vụ và giao diện tinh gọn

Kế thừa nguyên vẹn V6.128, chỉ chỉnh các điểm được mô tả dưới đây.

## Thay đổi có trong mã nguồn

- Bắt buộc cọc 20% trên phần **dịch vụ chăm sóc sau giảm giá**, không tính Pet Taxi / sản phẩm, nếu **chưa có lịch hoàn tất** hoặc **hai lịch kết thúc gần nhất được xét đều do khách hủy/No-show**. Không xét lịch do PetDay hủy và lịch QR quá hạn vào chuỗi hủy của khách. Trạng thái hủy do khách được đối chiếu từ booking_cancellation_requests / booking_no_shows, không suy ra chỉ từ `bookings.status`.
- Kiểm tra mốc giờ hủy khách **trước** khi tính quyền hoàn: đúng hoặc dưới 1 giờ đều không thể tự hủy, kể cả đơn mới cọc hoặc từng đổi lịch. Đơn đã trả đủ và hủy hợp lệ: hoàn 80% toàn bộ tiền đã xác nhận thu (bao gồm Taxi); cọc-only hủy do khách: 0%; PetDay không phục vụ: 100% tiền thực thu.
- Luồng Admin hủy do PetDay tính trên toàn giá trị đã thu thay vì chỉ phần chăm sóc; không tạo khoản hoàn Pet Taxi mới riêng. Vẫn trừ những khoản hoàn đã dự phòng trước đó để tránh vượt tiền thu. Hồ sơ hoàn mới được hệ thống xác nhận quyền hoàn, không yêu cầu duyệt tỷ lệ thêm.
- Trang chủ: **bỏ ô tìm kiếm phức tạp**, thay bằng hai nút đến **Dịch vụ** và **Cửa hàng**.
- Customer: hiện tiền cọc ngay thẻ lịch, giải thích khoản cọc nằm trong tổng hóa đơn; hiển thị khoản hoàn bên ngoài vùng xem chi tiết của lịch đã hủy; không trình bày số dư trên đơn đã hủy như khoản khách còn nợ.
- Giữ tự động No-show và Hoàn tất cuối ngày từ V6.128 (database migration 064), giữ ngày giờ VN. Tự hoàn tất không tạo chứng từ thu tiền mặt.
- Giữ quy tắc đổi lịch 1h/3h, tối đa một lần đổi do khách, không để trạng thái Taxi cũ chặn đổi/hủy. Cần migration 063 của V6.126 nếu DB chưa áp dụng.

## Hoàn tiền thực tế

Tự động **quyết định và ghi nhận quyền hoàn** không tương đương tự động **chuyển tiền ngân hàng**. Khi chưa tích hợp cổng chi trả và webhook xác minh, PetDay không được ghi `completed`/"Đã hoàn tiền" giả. UI dùng nhãn "Đã xác định khoản hoàn" cho hồ sơ đang chờ chi trả thật. Không cần Admin duyệt lại mức hoàn theo chính sách.

## Chạy thử

1. Giải nén. Sao lưu PostgreSQL TEST trước khi khởi động.
2. Nếu chưa áp dụng, chạy migration `database/063_v6126_reschedule_slot_compat.sql`, sau đó `database/064_v6128_booking_auto_close_audit.sql` trong pgAdmin, theo thứ tự; **không chạy lại** migration đã áp dụng.
3. Giữ `server/.env` của database TEST; nếu cần tránh cập nhật lịch cũ khi mới chạy, đặt `PETDAY_AUTO_CLOSE_ENABLED=false` trước. Không đính kèm hay chia sẻ mật khẩu DB.
4. Trong `PETDAY_OFFICIAL`: `npm install`, `npm run dev`.
5. Trong `PETDAY_OFFICIAL/server`: `npm install`, `$env:PORT="4001"; npm start` trong PowerShell khác.
6. Chạy `node --test test/*.test.js` trong thư mục server để kiểm thử phần logic.

## Kiểm thử cần thực hiện trên môi trường của người dùng

- Khách có lịch hoàn tất rồi hủy hai đơn liên tiếp -> lịch tiếp theo bắt buộc cọc, kiểm thử cả qua Admin/No-show; đơn do PetDay hủy không tính.
- Hủy đúng mốc 1 giờ (cọc-only, đã đổi, đã trả đủ) phải bị chặn; >1 giờ mới áp dụng mức hoàn.
- Một đơn gồm chăm sóc+Taxi, trả đủ -> hủy hoàn 80% thực thu; PetDay hủy -> hoàn 100% thực thu, không tạo sổ Taxi hoàn trùng.
- Đổi lịch có/không Taxi, giới hạn một lần khách đổi, Admin đổi vì PetDay, slot đầy và ngoại lệ giờ; thử không còn HTTP 409/422.
- QR cọc và phần còn lại, tiền mặt khi hoàn tất, chống thu/hoàn trùng; trạng thái chi trả có chứng cứ thật.
- Đơn ngày cũ tự No-show / Hoàn tất và lưu trú nhiều ngày không đóng sớm.
- Khách thấy khoản hoàn trên thẻ đã hủy và điều hướng trang chủ 2 nút.

**Giới hạn xác minh:** Đã chạy bài kiểm thử backend và kiểm tra cú pháp TypeScript/TSX; chưa chạy build Vite đầy đủ do thiếu thư viện cục bộ, chưa thực hiện kiểm thử trực tiếp trên PostgreSQL TEST của người dùng. Không khẳng định đã giải quyết mọi hành vi phát sinh trong dữ liệu cũ.

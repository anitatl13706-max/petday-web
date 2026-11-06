# PetDay V6.35 — Authentication, Finance & Compact Admin QA

## Tinh chỉnh thực tế

1. Sửa form **Đặt lại mật khẩu**: nhập xác nhận mật khẩu là một trường `required` nằm **trong** form; nút submit chỉ khả dụng khi hai mật khẩu khớp. Không tạo/reset tài khoản nếu form lỗi.
2. Token đặt lại mật khẩu chỉ giữ trong state của trang, xóa khỏi thanh địa chỉ sau khi đã đọc để tránh lưu lộ token vào history hay khi sao chép link. Đây không thay thế yêu cầu SMTP và kiểm tra hạn/token tại backend.
3. Gọn phân hệ Admin: các công cụ **thiết lập ngân hàng**, **yêu cầu hoàn tiền**, **nhật ký đối soát** và **quản lý mã ưu đãi** đưa vào khối mở rộng. Hàng đợi lịch và sổ thu tiền chính vẫn hiển thị như cũ.
4. Sổ thu tiền tối đa 8 lịch/trang, phân trang có thể quay lại; tìm kiếm và lọc sẽ tự trở về trang 1.
5. Chặn nút xác nhận thu đối với lịch đã hủy, không cố thu lần 2 trên lịch đã ghi nhận. Lịch hủy nhưng đã thu vẫn có trong lịch sử để xét hoàn tiền. Backend cũng có chốt kiểm tra trạng thái và transaction.
6. Điều chỉnh hiển thị form khôi phục, accordion và mobile; màu PetDay navy/coral.

## Kiểm thử thủ công bắt buộc trên máy chạy PostgreSQL

- [ ] Vào `?forgot=1`, nhập email hợp lệ; nếu không cấu hình SMTP thì không khẳng định email đã gửi.
- [ ] Mở link `?reset_token=...`, xác nhận token biến mất khỏi URL, form chỉ submit khi hai mật khẩu giống nhau.
- [ ] Token hết hạn/đã dùng không thay được mật khẩu; backend trả lỗi phù hợp.
- [ ] Admin → Tài chính: sổ thu tiền được chia trang, lọc Chưa thu/Đã thu/Tất cả hoạt động.
- [ ] Hủy lịch chưa trả tiền: không có nút xác nhận thu. Backend cũng từ chối PATCH thanh toán.
- [ ] Hủy lịch đã trả tiền: vẫn xuất hiện trong lịch sử Đã thu; không tự phát sinh hoàn tiền.
- [ ] Chuyển khoản: bắt buộc có ngân hàng đã cấu hình khi tạo lịch và mã giao dịch khi xác nhận thu.
- [ ] Tiền mặt: chỉ xác nhận sau khi thu thực tế; không xác nhận giả.
- [ ] Mobile (360px/390px): không tràn ngang, các accordion dễ bấm.
- [ ] Các đường dẫn menu Admin và Customer hoạt động, không render chéo tab.

## Thiết lập

- Không thêm SQL mới. Database phải có migration 001–020 của các bản trước.
- Chỉ chuyển file `server/.env` an toàn từ bản đang hoạt động; **không đóng gói .env**.
- Chạy `npm install` trong root và `server`; `npm run dev` mỗi nơi trên terminal riêng.
- Không chạy lại SQL cũ hoặc xóa database đang có.

## Xác minh tại môi trường biên soạn

- 120/120 unit tests Node đạt (7 test mới cho quy tắc sổ thu tiền).
- 18 file TS/TSX kiểm tra cú pháp bằng TypeScript transpileModule, không ghi nhận lỗi cú pháp.
- `node --check server/src/server.js` đạt.
- Production frontend build **chưa xác nhận**, npm install không hoàn tất trong môi trường kiểm tra.
- Không kết nối vào database người dùng và chưa kiểm thử end-to-end.

## Cơ sở tham khảo bố cục

- MoeGo Online Booking Dashboard (https://help.moego.pet/en/articles/13795617-online-booking-dashboard-overview): quản lý yêu cầu đặt lịch tập trung và quick access.
- MoeGo Pet Parent Portal (https://help.moego.pet/en/articles/14075819-pet-parent-portal-overview): tách lịch hẹn, hồ sơ thú cưng, báo cáo, phương thức thanh toán.

Không sao chép nhận diện thương hiệu bên ngoài; giao diện PetDay dùng navy/coral hiện có.

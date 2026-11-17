# PetDay V6.135 — Không hoàn thành & tìm kiếm chung

## Các thay đổi
- Admin có thể ghi **Không hoàn thành** khi lịch đã ở `Đang thực hiện`, đã `check_in`, và chưa có `check_out`/bàn giao. Lý do thuộc danh sách chuẩn và ghi chú >=10 ký tự là bắt buộc. API: POST `/api/admin/bookings/:code/incomplete` (JWT Admin); tạo `service_events.event_type='incomplete'`, chuyển trạng thái booking trong cùng transaction, thông báo khách.
- Không tự ghi nhận thu tiền mặt, không tự hoàn tiền và không xóa số tiền còn phải thu. Dịch vụ **đã chăm sóc xong nhưng chưa trả tiền** không được chuyển Không hoàn thành.
- Khách vẫn thấy tiến trình 3 bước bình thường; trạng thái Không hoàn thành/Đã hủy/No-show chỉ xuất hiện khi thật sự phát sinh.
- Home có ô tìm kiếm dịch vụ và sản phẩm bằng từ khóa; dịch vụ sử dụng API `/api/public/services`, sản phẩm dùng `/api/public/retail-search` (chỉ sản phẩm active). Kết quả dẫn tới đặt dịch vụ hoặc danh sách sản phẩm được lọc.

## Cần làm trước khi chạy — BẮT BUỘC
1. **Sao lưu PostgreSQL TEST**.
2. Mở pgAdmin → chọn database TEST `petday` → Query Tool.
3. Chạy nguyên file `database/055_v6135_incomplete_service.sql` đúng một lần. Migration cập nhật CHECK constraint trạng thái của `bookings` và loại sự kiện `service_events`. Không chạy trên database production chưa sao lưu/kiểm thử.
4. Sao chép file `.env` từ V6.134 sang `PETDAY_OFFICIAL/server/.env` (không chia sẻ công khai). Mật khẩu/SMTP đã lộ trong ảnh trước đó nên thay các bí mật tương ứng.
5. Backend: `cd PETDAY_OFFICIAL/server; npm install; npm start`.
6. Frontend (terminal mới): `cd PETDAY_OFFICIAL; npm install; npm run dev`.
7. Giữ nhất quán cổng Backend với cấu hình proxy frontend; xem `vite.config.ts` và `.env`.

## Kiểm tra thực tế
- Admin tạo lịch đã thanh toán đúng mức bắt buộc, tiếp nhận pet và bắt đầu, rồi mở thẻ lịch > Không hoàn thành. Chọn lý do, nhập ghi chú ít nhất 10 ký tự, xác nhận.
- Trạng thái chuyển Không hoàn thành; nhật ký có lý do; khách thấy ngoại lệ thay vì 3 bước thành công.
- Gọi API tương tự bằng customer/staff token phải bị từ chối; gọi trên lịch Đã xác nhận/chưa check-in hoặc Hoàn tất phải bị từ chối.
- Kiểm tra số tiền đã thu, còn thu, hồ sơ hoàn tiền không tự thay đổi.
- Tìm Grooming, Spa, pate, sữa tắm ở trang chủ, mở kết quả; tìm từ vô nghĩa hiển thị rỗng đúng cách.

## Kết quả kiểm tra tự động
- 350/350 bài kiểm thử backend có sẵn đã đạt (node --test server/test/*.test.js).
- Parser TypeScript đã kiểm tra các file TS/TSX mới sửa và không phát hiện lỗi cú pháp.
- **Chưa chạy end-to-end trên database PostgreSQL TEST của người dùng**; không khẳng định migration và mọi luồng GUI đã kiểm chứng trực tiếp.

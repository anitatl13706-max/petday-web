# PetDay V6.68 — Demo tối giản (kế thừa V6.67)

## Mục tiêu
Ưu tiên đặt lịch chăm sóc thú cưng; các khu vực quản trị ngắn gọn và tách thanh toán khỏi tiến trình dịch vụ.

## Giao diện đã tinh gọn
- Tài khoản demo Admin duy nhất điều hành. Bốn *hồ sơ* nhân viên: Thanh Lam, Thiên Ân, Phụng Anh, Bảo Yến. Nếu bảng nhân viên trống, giao diện chủ động khởi tạo một lần khi Admin mở tab Nhân viên. Nếu bảng đã có nhân viên, **không tự thêm lại** hồ sơ đã bị xóa.
- Tab Nhân viên: thêm, sửa tên/chi nhánh, ngừng/kích hoạt và xóa hồ sơ **chưa từng sử dụng**. Hồ sơ từng phân công hoặc có dữ liệu liên quan không được xóa, chỉ ngừng và phân công lại.
- Ẩn luồng **đổi lịch, hoàn tiền và cấu hình tài khoản ngân hàng** khỏi giao diện demo. Không xóa bảng, lịch sử hoặc API cũ để tránh làm hỏng dữ liệu/test trước đây. Đây là rút gọn giao diện, **không phải gỡ bỏ hoàn toàn mã backend**.
- Khách muốn đổi ngày/giờ dùng quy trình hủy lịch hợp lệ rồi tạo lịch mới. Đối với lịch đã thu tiền, chương trình demo không tự hoàn tiền; trường hợp thực tế cần đối soát ngoài hệ thống theo chính sách.
- Đánh giá và duyệt đánh giá không còn nằm trong màn hình demo chính.

## Luồng dịch vụ
1. Khách chọn thú cưng, dịch vụ, chi nhánh và giờ -> Đang chờ xác nhận.
2. Admin duyệt lịch, hệ thống tự phân công hồ sơ nhân viên phù hợp hoặc chờ Admin chọn thủ công.
3. Khách tự mang thú cưng đến / Taxi bàn giao tại cơ sở. Taxi không được báo đón từ hai ngày trước.
4. Admin bấm **Bắt đầu dịch vụ** với ghi chú ngắn (>=3 ký tự) -> Đang thực hiện.
5. Ghi nhận chăm sóc -> Sẵn sàng bàn giao -> Hoàn tất dịch vụ. Các mốc được kiểm soát ở server; không cho bỏ qua.
6. Thanh toán dịch vụ ghi nhận riêng trong Tài chính, không tự đổi trạng thái Taxi/dịch vụ.

## Ảnh chăm sóc
- Nút tải ảnh nằm trong **Thao tác & nhật ký chăm sóc** trên thẻ lịch đang xác nhận/đang thực hiện.
- Hỗ trợ JPG, PNG, WebP tối đa 5 MB, có xem trước khi lưu mốc. Ảnh lưu trong `PETDAY_OFFICIAL/server/uploads`; cần sao chép cả thư mục khi đổi source.
- Nếu lỗi, kiểm tra Backend đang chạy, quyền ghi `server/uploads`, Proxy `/api` và mã lỗi ở Network -> `/api/pets/photo`.

## Thanh toán mô phỏng
Trong `PETDAY_OFFICIAL/server/.env` đặt `PETDAY_DEMO_PAYMENT=true`, chỉ dùng ở môi trường TEST/demo. Không sử dụng số tài khoản thật; không có giao dịch ngân hàng thật và không có hoàn tiền tự động.

## Cửa hàng
Giữ tab Đơn hàng cửa hàng và luồng nhận tại cửa hàng / giao tận nhà từ V6.67. Chức năng ngày dự kiến giao yêu cầu migration 039 **chỉ sau khi sao lưu và kiểm tra schema**.

## Thử nghiệm thủ công cần làm tại máy
- Admin duyệt lịch, phân công Thanh Lam; bắt đầu -> chăm sóc -> sẵn sàng -> hoàn tất.
- Tải ảnh JPEG thực 2–5 MB và xác nhận hiển thị lại trong nhật ký.
- Đã trả trước nhưng chưa đến: không tự check-in, không tự xác nhận Taxi.
- Thêm/sửa/ngừng/xóa thử hồ sơ nhân viên chưa phát sinh lịch; không xóa được người đã có lịch sử.
- Mở đơn hàng bán lẻ, xác nhận thanh toán, nhận tại quầy và giao tận nhà; kiểm tra lịch sử.

## Kiểm thử đã chạy trong môi trường đóng gói
- 148/148 backend unit tests.
- `node --check` server.js.
- TypeScript transpile diagnostic cho Portal.tsx và StaffPlanner.tsx: không lỗi cú pháp.
- Chưa chạy end-to-end với PostgreSQL TEST và browser của người dùng; chưa thể khẳng định chức năng tải ảnh/đặt hàng hoạt động thực tế.

# PetDay V6.133 — Tự đóng lịch và gộp tiếp nhận/bắt đầu

Bản gốc: V6.132. Bản V6.133 **không xóa dữ liệu** và **không yêu cầu migration mới** nếu database TEST đã được nâng cấp SQL 063 và SQL 064.

## Thay đổi

1. Nút Admin `Tiếp nhận & bắt đầu chăm sóc`: một thao tác xác nhận thú cưng đã ở cơ sở. Backend tạo **hai sự kiện lịch sử tương thích** (`pet_arrived` và `check_in`) trong cùng transaction và chuyển thẳng `Đang thực hiện`; không còn bước Bắt đầu riêng trên giao diện.
2. Pet Taxi là add-on, không yêu cầu thay đổi trạng thái Taxi trước khi tiếp nhận pet. Dữ liệu Taxi lịch sử vẫn được giữ nguyên.
3. Tác vụ auto-close xử lý toàn bộ ứng viên quá hạn (phân trang, không chỉ giới hạn 400 đơn đầu): `Đã xác nhận` chưa ghi nhận phục vụ => `Đã hủy - No-show`; `Đang thực hiện` quá hạn => `Hoàn tất`. Lịch **có chứng cứ đã phục vụ từ dữ liệu cũ nhưng vẫn Đã xác nhận** được hoàn tất, không bị tính No-show.
4. Daycare nửa ngày và cả ngày kết thúc theo ngày hẹn. Daycare lưu trú/nhiều ngày chỉ được xử lý khi có `endDate` tin cậy.
5. Không tự thêm khoản thu/biên nhận tiền mặt hay hoàn tiền trong auto-close. Hoàn tất thủ công tiếp tục yêu cầu xác nhận thực thu và cập nhật thanh toán trong transaction.
6. Tác vụ có nhật ký tại `booking_auto_close_events`; không xử lý lại đơn đã đóng. Không làm giả thanh toán hoặc chuyển tiền.

## Chạy trên Windows

Giải nén và dùng file `server/.env` **trỏ tới DB TEST** từ phiên bản hoạt động gần nhất. Sao lưu database trước khi bật job tự động.

Frontend (PowerShell 1):

```powershell
cd "$env:USERPROFILE\Downloads\PetDay_V6_133_AutoClose_Intake_Start_Fix\PETDAY_OFFICIAL"
npm install
npm run dev
```

Backend (PowerShell 2):

```powershell
cd "$env:USERPROFILE\Downloads\PetDay_V6_133_AutoClose_Intake_Start_Fix\PETDAY_OFFICIAL\server"
npm install
$env:PORT = "4001"
npm start
```

Trong `server/.env`, để bật tự đóng lịch: `PETDAY_AUTO_CLOSE_ENABLED=true`. **Nếu để `false`, job sẽ không chạy.** Dừng backend cũ trước để tránh xung đột cổng 4001.

## Kiểm thử trên DB TEST

- Lịch Spa 07/11 hoặc Daycare nửa ngày 11/11 **đã xác nhận**, không có sự kiện tiếp nhận: khởi động backend, tải lại trang → No-show, hoàn 0, không hiển thị như công nợ.
- Lịch có `pet_arrived` nhưng vẫn `Đã xác nhận` do bản cũ: sau ngày phục vụ → Hoàn tất, không phải No-show.
- Daycare lưu trú chưa tới `endDate`: không tự đóng.
- Tạo lịch tương lai, Admin bấm `Tiếp nhận & bắt đầu chăm sóc`: trạng thái chuyển ngay `Đang thực hiện`, nhật ký có 2 sự kiện tương thích; không có nút Bắt đầu riêng.
- Admin bấm Hoàn tất cho đơn tiền mặt: hỏi xác nhận đã thực thu, ghi đúng số dư, tránh thu trùng. Tự hoàn tất cuối ngày: không tạo biên nhận.
- Đơn có Taxi add-on: có thể tiếp nhận mà không cần xác nhận một hành trình Taxi riêng.
- Khởi động lại server: không nhân đôi No-show hoặc thông báo của lịch đã đóng.

**Chưa được kiểm thử kết nối với PostgreSQL riêng của người dùng trong môi trường này.** Nếu lịch vẫn bị kẹt, kiểm tra log `[auto-close] booking ...` trong terminal backend, các quyền database và cấu hình `PETDAY_AUTO_CLOSE_ENABLED`.

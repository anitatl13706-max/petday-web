# PetDay V6.103.6 — Phân biệt nguyên nhân hủy lịch phía Admin và Customer

## Quy trình nghiệp vụ

**1. Customer chủ động yêu cầu hủy**
- Khách gửi lý do qua **Lịch hẹn → Yêu cầu hủy**. Backend ghi nhận thời điểm gửi.
- Admin vào **Duyệt yêu cầu hủy** để chấp thuận hoặc từ chối; không được bỏ qua một yêu cầu đang chờ.
- Mức hoàn theo thời điểm gửi yêu cầu: >24 giờ = 100%, >3–24 giờ = 80%, 0–3 giờ = 0% mặc định; ngoại lệ sát giờ phải giải thích và ghi rõ số tiền.
- Hủy xong mới lập hồ sơ hoàn tiền (nếu đã thu tiền và có khoản hoàn); duyệt hoàn và xác nhận đã hoàn là hai thao tác riêng.

**2. Admin hủy hộ theo yêu cầu Customer (NEW)**
- Trong **Admin → Lịch hẹn**, chọn nguồn hủy **Hủy hộ theo yêu cầu của khách**, nhập lý do tối thiểu 10 ký tự.
- Hệ thống áp dụng **chính sách của Customer tại thời điểm Admin thực hiện hủy hộ**, không phải chính sách PetDay chủ động hủy.
- Hệ thống ghi dòng **booking_cancellation_requests** đã được chấp thuận và `resolved_by` để các API hoàn tiền, đối soát hiểu đúng nguồn hủy.
- Nếu khách đã tạo yêu cầu đang chờ, hệ thống **không cho dùng thao tác này**; Admin phải xét yêu cầu cũ, bảo đảm thời điểm gửi gốc được giữ nguyên.
- Với hủy sát giờ, chỉ Admin có quyền ghi ngoại lệ, không vượt tổng đã thu và phải có lý do ít nhất 15 ký tự.

**3. PetDay không thể phục vụ (NEW)**
- Trong **Admin → Lịch hẹn**, chọn **PetDay không thể phục vụ**, nhập lý do thực tế.
- Nếu đã ghi nhận tiền và chưa bắt đầu phục vụ, tạo hồ sơ **hoàn 100%**. Nếu chưa thu tiền, không tạo khoản hoàn.
- Không tự chuyển tiền hoặc tự đánh dấu `Đã hoàn tiền`.

**4. Khách không đến / dịch vụ đã bắt đầu**
- Sử dụng quy trình **Khách không đến** hoặc nhật ký chăm sóc hiện có; không dùng nút hủy thường để thay thế.
- Backend từ chối hủy khi đã có nhật ký sự kiện chăm sóc và chống xử lý trùng yêu cầu đang chờ.

## Điểm sửa kỹ thuật
- `server/src/server.js`: thêm payload `cancellationOrigin`, `cancellationReason`, `exceptionRefundAmount` cho API Admin hủy, ghi lịch sử hủy hộ vào bảng có sẵn, đồng bộ Pet Taxi, lịch đổi, thông báo và hoàn tiền; chặn hủy khi khách đã gửi yêu cầu đang chờ.
- `server/src/adminCancellationRules.mjs`: tính chính sách theo nguồn hủy; không tự gán 100% khi Admin hủy hộ.
- `src/Portal.tsx`: lựa chọn nguồn hủy, ghi lý do bắt buộc, xem tỷ lệ và khoản hoàn dự kiến, xác nhận trước khi thực hiện.
- `server/test/v61036_adminCancellationRules.test.js`: kiểm tra các nhánh nghiệp vụ.
- Không cần migration SQL mới; sử dụng bảng `booking_cancellation_requests` đang tồn tại. Mã nguồn không chứa `.env`.

## Chạy trên Windows
1. Sao lưu PostgreSQL local, giữ V6.103.5 làm bản dự phòng.
2. Giải nén; chép `server/.env` từ bản V6.103.5 đang chạy sang `PETDAY_OFFICIAL/server/.env` của bản mới. Không chia sẻ `.env`.
3. Dừng frontend/backend cũ, chạy `npm install && npm start` trong `PETDAY_OFFICIAL/server`.
4. Terminal khác: `npm install && npm run dev` trong `PETDAY_OFFICIAL`.
5. Không triển khai trực tiếp production khi chưa kiểm thử end-to-end.

## Checklist nghiệm thu
- Admin hủy hộ khách: còn 12 giờ, đã thu 300.000đ → hồ sơ dự kiến hoàn 240.000đ.
- Admin hủy hộ khách: còn 1 giờ, đã thu 300.000đ → mặc định không mở hồ sơ hoàn; chỉ mở ngoại lệ khi Admin chủ động nhập số tiền và lý do hợp lệ.
- PetDay không thể phục vụ: đã thu 300.000đ → mở hồ sơ dự kiến hoàn 300.000đ.
- Chưa thanh toán → không mở hồ sơ hoàn.
- Khách đã gửi yêu cầu hủy chờ duyệt → Admin hủy trực tiếp bị từ chối, phải dùng màn Duyệt yêu cầu.
- Đã có sự kiện chăm sóc → không thể hủy bằng nút thường.
- Admin đã hủy hộ Customer → không thể yêu cầu hoàn 100% riêng để vượt chính sách 80%/0%; không được hoàn 2 lần.
- Customer thấy trạng thái Đã hủy và thông báo kèm nguyên nhân, số tiền dự kiến; Pet Taxi đang chờ điều phối được đóng.
- Nút duyệt hoàn không đánh dấu đã hoàn; chỉ thao tác hoàn thực tế và đối soát mới được đánh dấu.

**Giới hạn:** Chưa chạy với PostgreSQL thật trên máy người dùng; tỷ lệ hoàn đang tính trên tổng tiền lịch và chưa tách riêng phí Taxi đã thực hiện hoặc hàng mua kèm. Cần quy định và xử lý riêng trước khi vận hành thực tế.

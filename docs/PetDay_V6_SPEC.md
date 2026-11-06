# PETDAY V6 — MASTER SPECIFICATION

**Ngày chuẩn hóa:** 02/11/2026 · **Hệ thống:** PetDay Service-First · **Nguồn:** danh sách 35 chức năng đã chốt và source PETDAY_OFFICIAL_Update.

**Quan trọng:** Đây là đặc tả triển khai/nghiệm thu đầy đủ; không đồng nghĩa 35 tính năng đã được viết và chạy thành công. Các mục dựa source được đánh dấu rõ trong ma trận CSV.

## A. Kiến trúc và nguyên tắc nhất quán

**Frontend:** React TypeScript/Vite, hai shell Customer và Admin tách điều hướng; **Backend:** Express + auth/role/validation; **Database:** PostgreSQL duy nhất; **Storage:** file ảnh qua backend với giới hạn/định dạng an toàn; **Email:** SMTP hoặc nhà cung cấp email có cấu hình, không giả thông báo gửi; **Job:** reminder queue với retry và chống gửi trùng.

Trang công khai: Trang chủ, Dịch vụ, Chi tiết, Cẩm nang, FAQ, Liên hệ, Đăng nhập/Đăng ký/Quên mật khẩu. Customer: Hồ sơ cá nhân, Thú cưng (cards ảnh), Đặt lịch 4 bước, Lịch hẹn, Pet Care Timeline, Đánh giá, Yêu cầu tư vấn. Admin: Dashboard, Booking, Lịch & chi nhánh, Dịch vụ & giá, Customers, Reviews, Tư vấn, Payments, Cấu hình. Không hiển thị nhãn API/PostgreSQL/DEMO cho khách.

## B. 35 chức năng — đầu vào, luồng và ngoại lệ

### ACC-01 · Đăng ký

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Nhập họ tên/email/mật khẩu, xác thực hợp lệ → kiểm tra email duy nhất → băm mật khẩu → tạo Customer → đăng nhập hoặc yêu cầu đăng nhập. Lỗi email trùng: 409, không tạo thêm. Admin không tự đăng ký công khai.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ACC-02 · Đăng nhập

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Email + mật khẩu → xác thực server → tạo phiên có thời hạn → route theo vai trò. Admin thấy dashboard, Customer thấy hồ sơ; từ chối tài khoản bị khóa; không tin role gửi từ frontend.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ACC-03 · Quên mật khẩu

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Nhập email → trả thông báo trung tính → gửi link có token băm/lưu server, 1 lần/30 phút → đổi mật khẩu → vô hiệu token và phiên cũ; giới hạn tốc độ; không tiết lộ tồn tại email; SMTP thực tế phải được cấu hình.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ACC-04 · Chỉnh sửa hồ sơ

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Đăng nhập → chỉ sửa tên, điện thoại và các trường được cho phép → xác nhận email/điện thoại nếu đổi → lưu audit; không tự ý đổi vai trò.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### PET-01 · Thêm Pet Profile

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chủ sở hữu chọn chó/mèo, nhập tên, giống, tuổi, cân nặng dương, sức khỏe, ảnh hợp lệ → upload có giới hạn dung lượng và chữ ký file → tạo hồ sơ theo owner_id; không đưa URL tùy ý không an toàn.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### PET-02 · Xem, sửa, xóa Pet Profile

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chỉ chủ tài khoản xem/sửa. Lịch sử đã có thì ẩn/lưu trữ (soft delete) thay vì xóa vật lý; không cho thao tác tạo lịch với hồ sơ archived. Đổi ảnh có preview/rollback nếu upload lỗi.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### PET-03 · Lịch sử chăm sóc

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Hiển thị từ các booking hoàn thành và care_records có xác nhận nhân viên; timeline theo ngày, pet_id, chi nhánh, dịch vụ, ghi chú; không sinh ghi chú giả.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### SRV-01 · Danh sách dịch vụ

**Vai trò:** Khách vãng lai hoặc Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Mở công khai danh mục các dịch vụ active theo loài, chi nhánh và mức giá từ database; không phụ thuộc đăng nhập.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### SRV-02 · Tìm kiếm, lọc dịch vụ

**Vai trò:** Khách vãng lai hoặc Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Tìm theo tên/từ khóa, lọc loài, nhóm, giá, thời lượng/chi nhánh, sắp xếp; áp dụng bộ lọc trên server khi dữ liệu đủ lớn.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### SRV-03 · Chi tiết dịch vụ

**Vai trò:** Khách vãng lai hoặc Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chi tiết mô tả, danh sách việc làm, thời lượng, giá từ, phụ phí, điều kiện loài/cân nặng, ảnh và đánh giá thật; CTA chọn dịch vụ.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-01 · Chọn thú cưng

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Hiển thị pet cards có ảnh, tuổi, cân nặng và nút thêm pet. Chỉ pet active của chủ đăng nhập; invalid health/pet species phải được cảnh báo trước khi chọn dịch vụ.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-02 · Chọn dịch vụ

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Hiện dịch vụ đủ điều kiện theo pet, chi nhánh; không hiển thị selectable các dịch vụ không hợp lệ. Chọn thêm add-on chỉ khi phù hợp.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-03 · Dynamic Pricing

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Server lấy bảng giá hiệu lực + phụ phí cân nặng + add-on + Pet Taxi + sản phẩm – ưu đãi; trả itemized quote có hạn dùng; không tin tổng tiền từ trình duyệt.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-04 · Chọn khung giờ trống

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chọn chi nhánh/ngày/slot; tính theo staff/resources/duration/capacity, bỏ slot quá khứ; khóa transaction và kiểm tra lại khi tạo lịch; chặn 2 lịch overlap cho cùng pet.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-05 · Xác nhận đặt lịch

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Hiện pet/dịch vụ/gói/slot/chi nhánh/phụ phí/phương thức thanh toán/chính sách → kiểm tra lại điều kiện và giá tại backend → dùng idempotency key → tạo Pending → trả code và thông báo.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-06 · Xem lịch hẹn

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chủ lịch xem lịch chờ/đã xác nhận/đang làm/hoàn thành/hủy, chi tiết tiền/trạng thái/điều kiện, bộ lọc và hoạt động; Admin chỉ thấy theo quyền.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-07 · Hủy lịch

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Khách yêu cầu hủy lịch Pending hoặc lịch Confirmed trước cut-off; nếu đã thanh toán thì tạo yêu cầu hoàn tiền, không gán Đã hoàn tiền tự động; staff xử lý ngoại lệ có audit.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### BKG-08 · Đổi lịch

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Khách chọn lịch đủ điều kiện → đề xuất slot khác → kiểm tra availability lại transaction → cập nhật thời gian/lịch sử thay đổi → thông báo staff và khách; đổi giá nếu khác phải xác nhận lại.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### PAY-01 · Chọn cách thanh toán

**Vai trò:** Customer · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Chọn tiền mặt tại cơ sở hoặc chuyển khoản; dùng thông tin tài khoản thật do Admin cấu hình, không gắn QR/IBAN giả; phương thức thay đổi trước thanh toán phải có quy tắc.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### PAY-02 · Trạng thái thanh toán

**Vai trò:** Customer / Staff/Admin khi xử lý · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Tách payment_status khỏi booking_status: unpaid → pending_verification (chuyển khoản) → paid / failed / refunded. Chỉ Admin/Staff được phép xác minh với chứng từ/audit; không tự paid khi khách bấm Đã chuyển.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### REV-01 · Gửi đánh giá

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Chỉ chủ booking hoàn thành, một booking một review; rating 1–5, comment có giới hạn, kiểm duyệt nội dung vi phạm theo chính sách minh bạch.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### REV-02 · Xem đánh giá

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Công khai review phù hợp chính sách, gắn dịch vụ và thời điểm; không tự tạo review demo dưới nhãn khách thật; lưu dấu trạng thái moderate.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-01 · Đăng nhập Admin

**Vai trò:** Admin · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Tài khoản role admin được cấp nội bộ → xác thực → dashboard; khách hàng bị chặn server-side tất cả route /api/admin/*; không có nút đổi role.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-02 · Quản lý dịch vụ

**Vai trò:** Admin · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Admin CRUD service, hiệu lực thời gian, giá, nhóm, mô tả, ảnh, thời lượng, loài/weight rules, add-on compatibility; không xóa cứng service đã được booking tham chiếu.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-03 · Quản lý lịch hẹn

**Vai trò:** Admin · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Admin xem/filter, xác nhận/từ chối/phân công/thực hiện/hoàn thành; chỉ chuyển trạng thái hợp lệ và ghi audit + thông báo; ghi care record trước khi hoàn tất nếu chính sách yêu cầu.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-04 · Quản lý khung giờ

**Vai trò:** Admin · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Admin cấu hình chi nhánh, lịch nhân viên, ca làm, ngày nghỉ, năng lực và resource; không cho giảm capacity gây xung đột booking đã xác nhận.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-05 · Quản lý khách hàng

**Vai trò:** Admin · **Ưu tiên:** P0

**Luồng và nghiệp vụ:** Admin tra cứu khách/pets/bookings theo phân quyền tối thiểu; phân biệt hỗ trợ và xem thông tin cá nhân; cấm sửa password và role tùy ý.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-06 · Kiểm duyệt đánh giá

**Vai trò:** Admin · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Review sau khi gửi → pending/published/hidden với lý do/audit; không xóa tùy tiện đánh giá thấp nhưng hợp lệ.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADM-07 · Dashboard KPI

**Vai trò:** Admin · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** KPI từ database: tổng booking, conversion, doanh thu đã xác minh, tỷ lệ hủy, lấp đầy capacity, rating; định nghĩa mẫu số, kỳ báo cáo, loại giao dịch test.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-01 · Gợi ý dịch vụ theo luật

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Engine dựa species/coat/weight/age/notes + lịch sử → danh sách đề xuất kèm giải thích; không diễn giải như chẩn đoán thú y/AI tự huấn luyện.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-02 · Pet Care Timeline

**Vai trò:** Customer / Staff/Admin khi xử lý · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Dòng thời gian từ record đã được Staff xác nhận theo pet: booking, ghi chú chăm sóc, ảnh được phép chia sẻ; không tự tạo mốc giả.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-03 · Dịch vụ add-on

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Lọc add-on theo chính dịch vụ/pet, kiểm tra tồn tại/giá/giới hạn khi xác nhận, lưu line_items, không bán add-on độc lập nếu quy định không cho.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-04 · Pet Taxi

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Bật tùy chọn nếu branch hỗ trợ; lấy địa chỉ đón/trả, cự ly/khu vực, slot xe, phí quote, trạng thái tiếp nhận; không tự nhận có xe nếu thiếu công suất.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-05 · Sản phẩm mua kèm

**Vai trò:** Customer · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Gợi ý sản phẩm phù hợp theo loài; không tự trừ kho trước khi xác nhận; quản lý stock và đơn hàng/line_items, không gộp giá ảo vào service fee.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

### ADV-06 · Nhắc lịch

**Vai trò:** Customer / Staff/Admin khi xử lý · **Ưu tiên:** P1

**Luồng và nghiệp vụ:** Lịch Confirmed có consent → tạo notification job trước 24h/2h → gửi email hợp lệ hoặc notification nội bộ → chống gửi trùng, ghi log; không cam kết SMS khi chưa có tích hợp.

**Nghiệm thu:** kiểm tra trường hợp thành công, đầu vào thiếu/sai, người không có quyền, refresh/truy cập từ trình duyệt khác, và dữ liệu PostgreSQL khớp kết quả giao diện.

## C. Booking wizard và trạng thái

**4 bước:** (1) thẻ thú cưng, (2) service card + add-on/sản phẩm/price line items, (3) chi nhánh/date/slot/Pet Taxi, (4) review + thanh toán + chính sách → submit. Ở bước cuối server kiểm tra lại mọi ràng buộc trong transaction.

**Booking:** Pending → Confirmed → In Progress → Completed; Cancelled khi đủ điều kiện, không chuyển từ Completed/Cancelled. Từ chối bởi Admin cần lý do riêng; không gán một booking bị từ chối là hoàn thành.

**Payment:** Unpaid → Pending verification (bank transfer) → Paid; refund_requested → refund_approved → Refunded, hoặc refund_rejected. Không dùng chọn phương thức làm bằng chứng đã trả tiền.

**Consultation:** New → In progress → Replied → Closed; customer được xem trả lời, staff không tự tuyên bố chat trực tuyến.

**Review:** Pending moderation → Published/Hidden; moderation có lý do/audit.

**Reminder:** Scheduled → Processing → Sent/Failed/Cancelled; hủy nếu booking đã hủy hoặc chuyển lịch; có idempotency.

## D. Data model đề xuất (cần migration trước khi dùng)

- users(id, email UNIQUE, password_hash, full_name, phone, role, status, created_at)
- pets(id, owner_id FK, name, species, breed, birth_date hoặc age, weight, coat_type, notes, photo_url, archived_at)
- services(id, code, category, title, description, duration_min, base_price, allowed_species, active)
- pricing_rules(id, service_id, weight_min/max, surcharge, effective_from/to)
- addons(id, service_id, name, price, active), products(id, sku, name, price, stock, active)
- branches(id, address, active), staff(id,user_id,branch_id,skills), shifts(id,staff_id,start_at,end_at), closures
- bookings(id,code,customer_id,pet_id,service_id,branch_id,staff_id,start_at,end_at,status,total,price_snapshot,payment_method,payment_status,idempotency_key,created_at)
- booking_lines(id,booking_id,kind,ref_id,label,quantity,unit_price,total), booking_status_history, reschedule_requests
- payments(id,booking_id,method,amount,status,bank_reference,verified_by,verified_at), refunds(id,payment_id,amount,reason,status,actor)
- pet_taxi_requests(id,booking_id,address,service_zone,fee,status,driver_id nullable)
- care_records(id,booking_id,pet_id,notes,care_date,staff_id), care_record_images
- reviews(id,booking_id,rating,comment,moderation_status,moderation_reason)
- consultation_requests(id,customer_id,contact_name,email,question,status,reply_text,responded_at)
- password_reset_tokens (hashed single-use), notification_jobs, notification_log, audit_log

**Tương thích:** source Official hiện dùng các bảng đơn giản và các booking text service/branch; thay đổi sang FK là kế hoạch migration từng giai đoạn, **không tự động sửa schema đang có**.

## E. UI/UX cuối cùng

- Header: logo, Dịch vụ, Quy trình, Cẩm nang, Tài khoản (một avatar/icon duy nhất, chevron nhỏ), CTA Đặt lịch. Admin có shell/sidebar riêng, không menu Customer.
- Pet Profile: cards ảnh 1:1, tên, chip loài, tuổi, cân nặng, “Sửa”, “Đặt lịch”, “Lưu trữ”; upload ảnh bằng nút rõ, preview tức thì, xóa ảnh và fallback.
- Booking step 1: cards chọn pet; step 2: ảnh dịch vụ + giá từ/chi tiết và add-on; step 3: lịch tháng + các slot còn chỗ theo availability; step 4: hóa đơn chi tiết + payment radio + xác nhận điều khoản, nút “Xác nhận đặt lịch”.
- Support: 2 tab “Trợ lý tự động” và “Nhân viên tư vấn”; nếu đã login, auto-fill contact và cho sửa; tư vấn là phiếu yêu cầu, có thông báo về phản hồi.
- Thiết kế: navy #142B55, coral #FF765E, white #FFFFFF, blue #DCEEFF; không lạm dụng khối xanh hoặc các form mặc định, contrast rõ, responsive/mobile, skeleton/loading, inline errors và empty states.
- Giá/địa chỉ/đánh giá phải minh bạch nguồn và trạng thái mẫu; không giả thanh toán online, nhân viên trực, hoặc hoạt động kinh doanh có thật.

## F. Chính sách BA tạm đề xuất — cần nhóm chốt

- Hủy/đổi miễn phí trước 24 giờ; từ 24 giờ trở xuống xử lý theo cơ sở (không tự động từ chối người dùng nếu chưa công bố chính sách).
- Đặt lịch sớm tối thiểu 2 giờ; không đặt trong quá khứ; Daycare chỉ chó; mức phụ phí theo các nhóm cân nặng hiện hành nhưng giá chính thức tính ở server.
- Một booking chỉ một review; payment và booking là hai trạng thái độc lập; nhân viên ghi care record trước khi kết thúc dịch vụ.
- Khách phải đồng ý điều khoản khi đặt và đồng ý nhận email nhắc lịch riêng nếu dùng chức năng này.
- Sản phẩm là cross-selling phụ trợ, không biến PetDay thành sàn TMĐT. Địa chỉ, tài khoản ngân hàng và số hotline trong prototype là dữ liệu chưa xác thực, cần cấu hình trước khi công bố.

## G. Kiểm thử bắt buộc trước báo cáo

**Tài khoản:** email trùng, mật khẩu sai, reset token cũ/đã dùng/không có SMTP, admin truy cập Customer URL, customer truy cập Admin API. **Pet:** ảnh >2MB/khác định dạng, sửa pet người khác, pet có lịch sử không xóa cứng. **Booking:** pet mèo Daycare bị từ chối, slot hết chỗ, 2 trình duyệt đặt đồng thời, refresh gửi trùng idempotency, giá backend khác UI, hủy/đổi trái hạn. **Thanh toán:** cash không tự paid, transfer chờ đối soát, hoàn tiền không tự động, không giả QR/STK. **Chăm sóc/đánh giá:** không review trước hoàn tất hoặc đánh giá lần hai; care record không bị tạo giả. **Tư vấn:** guest gửi phiếu, user nhận trả lời đúng tài khoản, role khác không đọc phiếu. **Nhắc lịch:** không gửi khi hủy, không gửi trùng sau retry. **Figma & BA:** đối chiếu từng màn hình với đúng API và test evidence.

## H. Mức hoàn thành thực tế từ source 004

**Đã có nền tảng nhưng cần E2E:** đăng ký, đăng nhập, reset-token (thiếu SMTP), pet CRUD trừ xóa, booking 4 bước, tính giá theo rules.js, availability đơn giản, hủy Pending, tiền mặt/chuyển khoản lựa chọn, trạng thái thanh toán thủ công, Admin booking status, timeline/care_records/review và tư vấn 2 chiều.

**Chưa đầy đủ:** tìm kiếm/filter chi tiết theo DB, giá và nhân viên/chi nhánh quản trị DB, reschedule, slot tính theo duration/nhân viên, review moderation, dashboard KPI theo DB, add-on, Pet Taxi, bán hàng kèm, reminders, refund workflow, upload ảnh quản trị lưu trữ vòng đời. Không được gọi là đã hoàn thiện V6 khi chưa phát triển và test.

**Phân kỳ gợi ý:** V6.1 nền account/Pet/catalog/booking/availability; V6.2 Admin/payment/consultation/review; V6.3 add-on/Taxi/products/reminders + KPI; cuối cùng thống nhất Figma, BA và slide. Không đổi thư mục/đổi database khi chuyển phiên bản; dùng git migration.

# PetDay V6.6 – ghi chú triển khai nghiệp vụ

## Đã sửa trong source V6.6
- Menu tài khoản đồng nhất, tách vai trò Admin / Customer. Các menu thanh toán, tư vấn hiện dẫn về trang có nghiệp vụ liên quan; chưa có route độc lập, không được tuyên bố đã hoàn thiện module riêng.
- Thêm nút **Xóa hồ sơ** cho Pet Profile, có xác nhận người dùng; backend kiểm tra chủ sở hữu. Nếu hồ sơ đã từng đặt lịch, API trả HTTP 409 và không xóa để giữ toàn vẹn lịch sử. Bước tiếp theo là chức năng lưu trữ (archive), không xóa cứng.
- Lịch hẹn cho thấy tiến trình Chờ xác nhận → Đã xác nhận → Đang thực hiện → Hoàn tất; người dùng được đánh giá sau Hoàn tất (API hiện hữu).
- Nút Câu chuyện PetDay chuyển đến nội dung giới thiệu trong trang, không còn là nút rỗng. Không sử dụng số năm hoạt động không xác thực.

## Nghiệp vụ còn thiếu – không đánh dấu hoàn thành
1. **Ẩn/lưu trữ hồ sơ thú cưng có lịch sử:** Migration `archived_at`, lọc danh sách chủ sở hữu, giữ lịch sử/chứng từ; có thao tác khôi phục. Trước khi thay schema phải xác minh trạng thái DB thực tế.
2. **Nhân viên tiếp nhận dịch vụ:** xác nhận -> check-in -> phân công -> đang phục vụ -> ghi nhật ký, ảnh trước/sau (tùy đồng ý) -> hoàn tất -> nhắc đánh giá. Mỗi thay đổi có actor/timestamp; không được nhảy trạng thái.
3. **Hủy/đổi lịch:** cutoff theo chính sách; chờ duyệt; kiểm tra slot có công suất tại thời điểm duyệt, khóa công suất chống race; xử lý thanh toán/hoàn tiền tương ứng.
4. **Thanh toán:** Tiền mặt ghi thu bởi Admin có bằng chứng, người ghi nhận và thời điểm; chuyển khoản chỉ khi cấu hình tài khoản thật. Khi tạo lịch sinh mã tham chiếu duy nhất, tiền chờ đối soát; nhân viên khớp số tiền + mã + giao dịch, từ chối kèm lý do; biên lai và sổ lịch sử thay đổi. Không tự dùng ảnh chụp màn hình làm bằng chứng đã trả tiền. Nếu dùng VNPAY Sandbox: xác thực chữ ký IPN, idempotency, trạng thái pending/success/fail, đối chiếu số tiền/mã đơn; return URL không có quyền xác nhận thu tiền.
5. **Đánh giá:** chỉ chủ lịch đã hoàn tất được gửi 1 lần, có đánh giá và nội dung, xử lý kiểm duyệt có lý do và hiển thị minh bạch. Sau khi hủy không đánh giá dịch vụ.
6. **Pet Taxi:** khu vực phục vụ, địa chỉ, chi phí định trước, giờ nhận/trả, phân công tài xế và giao nhận có xác nhận, xử lý ngoại lệ.
7. **Add-on và sản phẩm:** cấu hình tương thích dịch vụ/loài/cân nặng, giá theo server, tồn kho sản phẩm, order items và trường hợp hết hàng khi checkout.
8. **Quên mật khẩu:** SMTP/nhà cung cấp email thật, reset token hash + TTL + one-time, giới hạn tần suất, phản hồi trung tính không lộ email có tồn tại; gửi email fail phải báo trạng thái phù hợp; link dựa trên frontend origin đúng.
9. **Chatbot:** FAQ/tri thức duyệt trước và chuyển sang nhân viên, lưu hội thoại/phiếu hỗ trợ đúng quyền; chưa kết nối AI thật không gọi là AI tạo sinh.
10. **Nhắc lịch:** queue/job scheduler, chỉ gửi lịch còn hiệu lực, idempotent, logging lỗi và retry, cho khách chọn nhận thông báo.
11. **Dịch vụ theo cân nặng:** phải có bảng giá có hiệu lực, trích từ cấu hình Admin/DB; quote server trả line-items, tổng tiền chốt khi tạo booking, giải thích giá trước/sau đặt.

## Kiểm thử tối thiểu
- TC01: tạo pet mới rồi xóa thành công.
- TC02: pet đã có lịch sử => xóa thất bại 409, dữ liệu lịch và pet không bị thay đổi.
- TC03: vào menu Customer không thấy menu Admin; Admin có menu điều hành và không có thao tác Customer.
- TC04: Customer đặt lịch, xem trạng thái; Admin chỉ chuyển bước hợp lệ; Customer refresh thấy tiến trình mới.
- TC05: chỉ lịch `Hoàn tất` đánh giá, một lịch không thể gửi đánh giá 2 lần.
- TC06: chọn bank transfer khi thiếu tài khoản ngân hàng => không cho đặt lịch loại này.
- TC07: upload ảnh: API nhận ảnh, lưu photo_url, tải lại trang ảnh hiển thị, xóa ảnh không xóa pet.
- TC08: CTA Câu chuyện PetDay mở nội dung không trống.

## Cài đặt
Giữ `server/.env` bí mật ở máy cá nhân, không gói trong ZIP. Cấu trúc gồm `PETDAY_OFFICIAL/package.json` và `PETDAY_OFFICIAL/server/package.json`; chạy npm từ đúng thư mục. Bản này không có migration mới; không chạy lại SQL cũ.

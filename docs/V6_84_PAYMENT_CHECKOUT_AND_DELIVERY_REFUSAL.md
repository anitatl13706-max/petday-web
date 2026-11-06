# V6_84 — Thanh toán dịch vụ và cảnh báo giao hàng thất bại

## Đã sửa trong source
- Khi khách tạo lịch dịch vụ bằng chuyển khoản, lưu mã lịch vào sessionStorage để mở ngay tab Thanh toán khi chuyển từ Đặt lịch sang Lịch hẹn. Lịch mới được đưa lên đầu và tự cuộn đến biểu mẫu chi tiết người chuyển. Khách không phải tự tìm lịch mới.
- Giữ nguyên Backend POST `/bookings/:code/transfer-notice` và biểu mẫu chia sẻ của V6_83. Admin vẫn là người xác nhận thanh toán; không tự coi khách đã trả tiền vì bấm gửi.
- Gỡ banner thử nghiệm lớn lặp lại ở Cửa hàng; giữ thông báo an toàn ngắn trong biểu mẫu gửi thông tin.
- Bỏ dòng trạng thái thanh toán trùng bên trong thanh tiến trình lịch hẹn. Trạng thái thanh toán vẫn nằm bên ngoài; không thay đổi dữ liệu.
- Không có migration mới.

## Nghiệp vụ cần phát triển riêng: giao hàng khách từ chối nhận
**Chưa được code trong V6_84:** Phải thiết kế luồng `shipping -> delivery_failed -> returned` có nguyên nhân, ngày/giờ, số lần giao và bằng chứng nghiệp vụ. Không được tự đánh dấu hoàn tất giao hàng, tự hoàn tiền, hoặc cộng lại tồn kho trước khi hàng thật sự quay về và được kiểm hàng.
- COD: chưa thu tiền → giao thất bại → liên hệ khách thử giao lại hoặc trả hàng về kho; không ghi nhận doanh thu.
- Chuyển khoản đã xác nhận: giao thất bại → liên hệ khách để giao lại hoặc duyệt hủy/hoàn tiền; phải ghi nhận công nợ hoàn tiền và chống hoàn trùng.
- Phí giao lại/không nhận hàng: cần chính sách công khai trước khi thu tiền, không tự trừ phí.
- Cần bảng/bản ghi vận hành giao hàng để theo dõi nguyên nhân và lịch sử thay đổi. Chỉ phát triển sau khi đã chốt điều kiện giao lại, trả hàng, và phí.

## Kiểm tra
- Backend: npm test (162/162 đạt).
- Kiểm tra cú pháp frontend qua node scripts/check-syntax.mjs (sử dụng TypeScript cài sẵn trong môi trường tạo file).
- Không chạy kiểm thử E2E trên PostgreSQL TEST của người dùng.

## Chạy trên Windows
1. Sao chép `PETDAY_OFFICIAL/server/.env` từ V6_83 (không ghi đè DB).
2. Đảm bảo schema các migration trước đã đồng bộ, nhất là 042 và 043 cho chuyển khoản.
3. Tắt PetDay cũ chiếm 4000/8443.
4. Chạy ở thư mục ngoài: `powershell -ExecutionPolicy Bypass -File .\START_PETDAY_V684.ps1`.
5. Khách đăng nhập, đặt lịch chọn chuyển khoản, xem tab Thanh toán mở tự động và biểu mẫu nhập thông tin; kiểm thử song song đơn Cửa hàng.

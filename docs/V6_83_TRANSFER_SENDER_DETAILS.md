# V6.83 – Biểu mẫu thông tin chuyển khoản cho Dịch vụ và Cửa hàng

## Tính năng
- Customer chọn chuyển khoản. Backend tạo đơn và tính tổng tiền; khách không sửa số tiền.
- Cửa hàng: sau khi tạo đơn, Lịch sử mua hàng tự mở với biểu mẫu ở đúng đơn. Khách có thể quay lại nếu đóng trang/quên gửi.
- Dịch vụ: vào Lịch hẹn → Thanh toán → biểu mẫu chuyển khoản của lịch.
- Khách nhập **Ngân hàng người chuyển**, **Tên người chuyển**, mã giao dịch nếu có và ghi chú; gửi thông tin.
- Hệ thống lưu trạng thái **chờ xác nhận** bằng bản ghi notice; **không** tự đánh dấu đã nhận tiền.
- Admin nhìn thấy ngân hàng người chuyển, tên và mã tham chiếu trong mục đối soát.
- Không cần OTP, số tài khoản của khách, hoặc quyền truy cập ngân hàng.

## CẬP NHẬT POSTGRESQL TEST
1. Sao lưu PostgreSQL TEST.
2. Đảm bảo đã có migrations tạo bảng `bank_transfer_notices` và `retail_transfer_notices` (031/023 và 042).
3. Chạy đúng một lần SQL `database/043_v683_transfer_sender_details.sql` bằng pgAdmin Query Tool trên database TEST.
4. Sao chép `server/.env` từ phiên bản chạy ổn sang source này. Nếu đang mô phỏng, giữ `PETDAY_DEMO_PAYMENT=true`.
5. Dừng PetDay bản cũ, chạy `START_PETDAY_V683.ps1` từ thư mục ngoài cùng.

## NGHIỆM THU
- Shop: đơn chuyển khoản → biểu mẫu hiện → nhập ngân hàng + tên → gửi → thông báo chờ Admin → Admin thấy thông tin.
- Dịch vụ: đặt lịch chuyển khoản → mục Thanh toán → gửi biểu mẫu → Admin thấy thông tin.
- Reload trình duyệt: thông tin vẫn lưu.
- Không gửi nếu thiếu ngân hàng/tên. Không ghi nhận `paid` từ nút gửi.
- Tiền mặt không cần biểu mẫu.
- Dữ liệu cũ không mất; thông tin sender của notices cũ có thể NULL.

## GIỚI HẠN
Không tích hợp ngân hàng thực; không tự xác minh chuyển tiền và không thực hiện chuyển tiền bằng nút UI. Chưa kiểm thử với PostgreSQL của người dùng.

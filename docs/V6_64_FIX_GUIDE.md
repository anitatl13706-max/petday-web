# PetDay V6.64 – kiểm tra và sửa hiển thị đặt lịch

## Các sửa đổi giao diện
- Ảnh thú cưng: fallback emoji, không để ảnh lỗi che icon. Ảnh cũ hỏng cần tải lại trong Tài khoản → Thú cưng (file lưu tại server/uploads, không mang theo khi đổi ZIP).
- Cảnh báo loài đúng theo gói đang chọn; chỉ hiện Daycare khi chọn Daycare.
- Thẻ điều kiện tách rõ theo gói với màu trung tính và icon.
- Pet Taxi có hai mức KHOẢNG CÁCH DỰ KIẾN: đến 5 km (70.000đ), hơn 5–10 km (120.000đ). Đây là chính sách tạm đề xuất cho demo, chưa tính bản đồ; nhân viên phải xác minh tuyến đường thực tế. Không chọn khi >10 km, không cam kết tự động nhận khách.
- Admin → Tài chính → Cấu hình chuyển khoản: nhập tên ngân hàng, số tài khoản (6–25 chữ số), chủ tài khoản (>=3 ký tự), lưu. Khách chỉ chọn được sau khi /api/payment/options trả bankTransfer.enabled=true.

## LỖI PostgreSQL 25P02
25P02 không phải lỗi gốc: một lệnh trước trong BEGIN đã thất bại. Bấm ROLLBACK; rồi chạy riêng từng lệnh kiểm tra chỉ-đọc trong docs/DIAGNOSTIC_ONLY_V64.sql; xem MESSAGES lỗi đầu tiên trước khi sửa bất kỳ constraint nào. Không chạy lại migration 001–021 hoặc 022/030 khi chưa xác định nguyên nhân.

## Ảnh upload
Ảnh tải lên chỉ lưu ở `PETDAY_OFFICIAL/server/uploads` của bản cũ. Khi giải nén source mới, phải sao chép thư mục `server/uploads` từ bản cũ đang chạy, không chỉ `.env`, nếu muốn giữ hình đại diện. Không chép đè lên DB.

## Kiểm tra ứng dụng
1. Đăng nhập Customer, mở đặt lịch, chọn pet có ảnh; nếu file không còn, fallback phải hiện emoji.
2. Chọn Grooming cho mèo; không được hiện thông báo Daycare. Chọn Daycare cho mèo; phải báo không phù hợp.
3. Chọn Pet Taxi: khoảng cách đề xuất, số điện thoại, địa chỉ; nhân viên phải kiểm tra lại.
4. Admin lưu cấu hình ngân hàng; Customer tải lại và thử chọn chuyển khoản; Staff chỉ xác nhận sau khi đối soát tiền thực nhận.
5. Nếu `/bookings` HTTP 503, xem lỗi `bookings_service_check` trong backend và chỉ đối chiếu migration 022 sau khi sao lưu.

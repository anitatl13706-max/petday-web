# PetDay V6.44 — kiểm soát gói dịch vụ và kiểm thử khởi động

## Mục tiêu
V6.44 nâng cấp V6.43.1 theo hướng **làm đúng nghiệp vụ thay vì tăng số menu**. Tham khảo MoeGo: gói dịch vụ phải có trạng thái mở nhận lịch online, giá cấu hình riêng và bộ lọc theo hồ sơ thú cưng.

## Thay đổi triển khai thực tế
- Admin → Tài chính → Bảng giá dịch vụ: đặt giá và **Mở nhận lịch / Tạm ngừng** cho 8 gói đã định nghĩa.
- PostgreSQL giữ `service_price_settings.is_active` (SQL 026). Gói ngừng bán không xuất hiện ở API danh mục và trang công khai.
- Backend chặn báo giá mới, khung giờ, mã giảm giá và tạo lịch mới với gói bị tạm ngừng. Trước khi lưu, backend kiểm tra trạng thái trong giao dịch bằng `FOR SHARE` nhằm không chèn lịch trong lúc Admin đồng thời đóng gói.
- Lịch đã tạo vẫn giữ nguyên mã, tổng tiền, dòng giá và lịch sử. Đơn đang xử lý không bị hủy do Admin tạm ngừng nhận lịch mới.
- Thêm `npm run test:startup` và `npm run verify:release` để bắt lỗi dạng `TypeError ... is not a function` khi import toàn bộ Express server. Đây là bước không có ở bản V6.43 và là lý do từng có 131/131 test đạt nhưng backend chết lúc khởi động.
- Đổi cấu trúc danh sách gói online để thẻ dịch vụ hiển thị đúng gói đang mở.

## Cài đặt an toàn (không xóa database)
1. Sao lưu database `petday` bằng pgAdmin.
2. Đối chiếu SQL 001–025 đang áp dụng; **không chạy lại** các file cũ.
3. Mở `database/026_v644_service_publication.sql` trong Query Tool kết nối `petday`, chạy một lần.
4. Sao chép `server/.env` của bản đang hoạt động sang bản mới, không chia sẻ bí mật.
5. Trong `server`: `npm install`, `npm run verify:release`, `npm run dev`.
6. Trong thư mục `PETDAY_OFFICIAL`: `npm install`, `npm run check:syntax`, `npm run build`, `npm run dev`.
7. Kiểm tra `/api/health`, `/api/health/schema`, rồi đăng nhập Admin và thử mở/tạm ngừng một gói; mở tab ẩn danh xem danh mục. Đổi trở lại trạng thái mở sau khi kiểm thử.

## Tình huống kiểm thử trọng tâm
| ID | Thao tác | Kết quả mong đợi |
|---|---|---|
| SP-01 | Admin chỉnh giá Grooming cơ bản | Giá mới lưu DB và xuất hiện khi tải lại trang dịch vụ |
| SP-02 | Admin tạm ngừng Grooming cơ bản | Gói không hiển thị cho khách mới và không thể tạo lịch mới |
| SP-03 | Customer thử POST lịch khi gói tạm ngừng | HTTP 409 và thông báo rõ |
| SP-04 | Admin mở lại gói | Gói xuất hiện lại trên trang dịch vụ và đặt lịch |
| SP-05 | Admin ngừng gói từng có lịch | Lịch cũ, giá cũ, thanh toán và chăm sóc vẫn giữ nguyên |
| SP-06 | Chạy `npm run test:startup` | Máy chủ có thể import và listen với env thử nghiệm, không sửa dữ liệu |
| SP-07 | Chọn tiền mặt / chuyển khoản | Chuyển khoản chỉ mở khi cấu hình ngân hàng, không tự xác nhận đã thu |
| SP-08 | Quên mật khẩu | Chỉ gửi email khi SMTP thật đã cấu hình, không hiển thị token cho khách |

## Chưa hoàn thành
Đây **không phải** CRUD bất kỳ gói mới: 8 tên gói, thời lượng, sức chứa và eligibility vẫn nằm trong `server/src/rules.js`. Đơn hàng riêng hỗ trợ nhận tại chi nhánh, chưa có vận chuyển/trả hàng tự động. SMTP thật cần thông tin do chủ hệ thống cấp và thử email giao nhận. Các đường nghiệp vụ cần được kiểm thử end-to-end với PostgreSQL trên máy người dùng.

## Nguồn tham khảo (ngoại hệ thống PetDay)
- https://help.moego.pet/en/articles/13704211-online-booking-grooming-service-setting
- https://help.moego.pet/en/articles/13708065-online-booking-multi-service-setting
- https://help.moego.pet/en/articles/11116749-setting-up-your-grooming-services

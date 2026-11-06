# PetDay V6.43 — Khôi phục giao diện và kiểm thử nghiệp vụ

## Phạm vi thay đổi so với V6.42

- Sửa trang trắng không rõ nguyên nhân bằng ErrorBoundary và màn hình dự phòng cho lỗi tải module; hiển thị lỗi cụ thể thay vì im lặng.
- Trang `/#kiem-tra-he-thong` kiểm tra 6 endpoint theo thời gian thực: máy chủ, schema 20 bảng, ràng buộc 8 gói, schema nghiệp vụ 021–025, SMTP và phương thức thanh toán.
- Endpoint `GET /api/health/workflows` chỉ đọc `information_schema`, báo bảng/cột thiếu của các luồng mới; không lộ số tài khoản hoặc dữ liệu người dùng.
- Thêm lệnh `npm run check:syntax` để kiểm tra cú pháp trước khi khởi động.
- Giữ các module nghiệp vụ V6.42; không thay đổi dữ liệu hoặc migration cũ.

**Quan trọng:** Bản mới tăng khả năng ổn định/chẩn đoán nhưng không đảm bảo đã tìm được nguyên nhân runtime của màn hình trắng trước đó; cần ảnh Console khi lỗi tái diễn. Không có migration 026. Chưa thể đánh dấu tất cả luồng dưới đây đã hoàn tất và test thực tế.

## Bảng truy vết theo đề bài

| Nhóm | Chức năng | Nền tảng source | Việc phải kiểm thử/cấu hình |
|---|---|---|---|
| Tài khoản | Đăng ký, đăng nhập, sửa hồ sơ | API PostgreSQL đã có | Đăng ký→đăng nhập→sửa→reload |
| Tài khoản | Quên mật khẩu | Token băm, hạn 30 phút, SMTP tùy chọn | Đòi cấu hình SMTP thật; gửi email thử và reset |
| Pet Profile | Thêm, xem, sửa, xóa có điều kiện | API đã có | Ảnh JPG/PNG/WebP dưới 2MB, dữ liệu reload, xóa có lịch sử phải từ chối |
| Pet Profile | Lịch sử chăm sóc | Booking, service timeline | Kiểm tra từng pet và phân quyền dữ liệu |
| Dịch vụ | Danh sách, tìm kiếm/lọc, xem chi tiết | 8 gói/3 nhóm | Giá từ database và điều kiện loài |
| Đặt lịch | Chọn pet, gói, giá động, khung giờ, xác nhận | Quote, capacity, booking | Test 8 gói, đổi lịch/hủy và lịch 500; kiểm tra SQL 022/025 |
| Thanh toán | Chọn phương thức, trạng thái | Cash, bank transfer đối soát thủ công | Cấu hình ngân hàng; không ghi paid trước khi nhận tiền |
| Đánh giá | Gửi, xem và kiểm duyệt | Reviews, moderation | Chỉ lịch Hoàn tất, duyệt rồi mới công khai |
| Admin | Đăng nhập, lịch, giờ, khách, KPI | API và dashboard | RBAC, phân công, báo cáo và lọc |
| Admin | Quản lý dịch vụ | Chỉnh giá 8 gói trong PostgreSQL | Chưa CRUD tên gói linh hoạt; cần thêm module riêng |
| Nâng cao | Gợi ý luật, timeline, add-on, Pet Taxi | Có các module nền tảng | Phân biệt luật/tiêu chí, trạng thái đón và tính phí |
| Nâng cao | Sản phẩm mua kèm | Đã giữ/hoàn tồn khi đặt và hủy lịch | Test tồn kho đồng thời và idempotency |
| Nâng cao | Nhắc lịch | Thông báo nội bộ | Không mặc nhận là email/SMS; xem phân quyền |
| Bán lẻ | Đơn độc lập tại cơ sở | API và UI V6.42 | Chưa giao tận nhà / trả hàng / hoàn tiền tự động |

## Cài đặt Windows an toàn

1. Sao lưu database `petday` trước khi thao tác nâng cấp.
2. **KHÔNG chạy lại migration 001–025** nếu đã áp dụng và database đang có dữ liệu. V6.43 không có migration mới.
3. Sao chép `server/.env` hoạt động từ V6.42 sang `PETDAY_OFFICIAL/server/.env` (đừng chia sẻ file/khóa bí mật).
4. Dừng frontend và backend phiên bản cũ; chỉ chạy một tiến trình cổng 4000 và một tiến trình cổng 8443.
5. Tại `PETDAY_OFFICIAL/server`: `npm install`, `npm test`, `npm run dev`.
6. Tại `PETDAY_OFFICIAL`: `npm install`, `npm run check:syntax`, `npm run build`, `npm run dev`.
7. Truy cập `http://localhost:8443/#kiem-tra-he-thong` trước khi thử đăng nhập; kiểm tra `/api/health/workflows` riêng.
8. Nếu trắng: mở F12→Console, chụp lỗi đầu tiên. Nếu build không chạy, chụp Terminal frontend. Không chạy SQL để chữa lỗi JS.

## Hành trình demo tích hợp

1. Đăng ký Customer → tạo pet → tải ảnh → tìm gói Grooming → chọn add-on → đặt giờ trống.
2. Thanh toán tiền mặt, hoặc chuyển khoản khi đã có tài khoản ngân hàng → gửi thông báo đã chuyển → Admin đối soát thật.
3. Admin duyệt lịch → tạo ca phù hợp → phân công → Staff check-in → timeline → hoàn tất → Customer đánh giá → Admin duyệt.
4. Admin cập nhật giá 8 gói → trang dịch vụ công khai đổi giá → tạo lịch mới, đối chiếu giá; lịch cũ giữ nguyên giá.
5. Customer mua sản phẩm độc lập → trừ tồn → Admin xác nhận và bàn giao, không tự nhận đã thu tiền.
6. Kiểm tra chương trình nhắc lịch và thông báo khi có trạng thái mới; phân biệt in-app với SMTP.

**Không được công bố đã hoàn tất E2E khi chưa kiểm thử trên PostgreSQL của người dùng.**

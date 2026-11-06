# PETDAY V6.36 — KHẮC PHỤC LỖI VÀ KIỂM THỬ BẮT BUỘC

## 1. Ba nguyên nhân trong ảnh người dùng

1. **Quên mật khẩu**: HTTP 503 từ `/api/auth/forgot-password` vì `server/.env` thiếu cấu hình SMTP. Token khôi phục đã có trong backend; **không thể gửi email thật nếu chưa khai báo tài khoản gửi thư được phép sử dụng**. Không hiển thị token, không tạo liên kết giả.
2. **Lịch hẹn và phân công**: HTTP 503 từ PostgreSQL `42P01`/`42703`, các migration cũ chưa đồng bộ. `/api/health` trả `ok:true` không xác nhận schema đầy đủ. V6.36 chỉ hiển thị danh sách bảng/cột thiếu và gợi ý file SQL. **Không tự chạy migration** vào database đang có dữ liệu.
3. **Ảnh thú cưng**: ảnh được tải vào `server/uploads/`, URL `/uploads/...`; phải có quyền ghi và proxy Vite `/uploads` ở localhost:8443. Chọn ảnh xong phải bấm Thêm thú cưng / Lưu thay đổi. V6.36 báo HTTP cụ thể và lỗi lưu ổ đĩa (nếu có), phân biệt upload thành công với lưu hồ sơ.

## 2. Cài từ bản cũ

- Sao lưu database `petday` bằng pgAdmin trước. Không xóa DB, không sửa password_hash hoặc role bằng SQL.
- Giải nén source. Sao chép **server/.env** của bản đang chạy (không chia sẻ file có mật khẩu).
- Trong terminal backend: `cd server`, `npm install`, `npm run db:doctor`. Đây là kiểm tra **chỉ đọc**.
- Mở `http://localhost:4000/api/health/schema` khi server chạy. Nếu HTTP 503, đọc `missing` và `suggestedMigrations`.
- Trong pgAdmin, xác nhận database đang là `petday` qua `SELECT current_database();`. Mở **những migration còn thiếu từ database/009_v612_safe_upgrade.sql đến database/020_v628_cancellation_review.sql theo đúng thứ tự và kiểm tra từng file**, KHÔNG chạy lại 001–008 hoặc các file đã áp dụng trừ khi có lý do và đã kiểm tra tính idempotent. File 017 có tạo constraint tên `petday_users_role_v620` và có thể lỗi nếu chạy lại. SQL 009 có thể yêu cầu các bảng nền tảng. Không đoán và không chạy bừa nếu không chắc trạng thái.
- Chỉ tiếp tục test khi `/api/health/schema` trả `schemaReady:true` và `missing:[]`. Nếu migration báo lỗi, dừng tại file đó, kiểm tra log pgAdmin và sao lưu; không bỏ qua để chạy file sau.

## 3. Cấu hình quên mật khẩu

Trong `server/.env` thêm (giữ bí mật App Password):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=ACCOUNT@gmail.com
SMTP_PASS=GMAIL_APP_PASSWORD
SMTP_FROM=PetDay <ACCOUNT@gmail.com>
RESET_BASE_URL=http://localhost:8443/?reset=1#tai-khoan
```

Dùng tài khoản email mà bạn sở hữu/được phép gửi; với Gmail cần App Password và xác thực hai bước nếu tài khoản đủ điều kiện. **Không dùng mật khẩu đăng nhập Gmail thường**. Khởi động lại backend. Kiểm tra `/api/health/features` (configured true chỉ là cấu hình đủ, phải gửi email thử mới xác nhận được). Kiểm thử tài khoản thật của bạn, email nhận được, liên kết hết hạn 30 phút, mật khẩu mới đăng nhập được, liên kết đã dùng không dùng lại được.

## 4. Kiểm thử tải ảnh

- Đăng nhập Customer, vào Hồ sơ thú cưng; chọn file JPEG, PNG hoặc WebP dưới 2 MB.
- Bấm Tải ảnh lên → nếu thành công sẽ hiện ảnh xem trước và thông báo. **Bấm Thêm thú cưng / Lưu thay đổi** để cập nhật database.
- Tải lại trang, kiểm tra ảnh còn hiển thị. Mở tab Network nếu lỗi, kiểm tra `POST /api/pets/photo` và `GET /uploads/<file>`; không gửi token đăng nhập.
- Nếu `401`: đăng nhập lại. `413`: nén ảnh. `507`: kiểm tra quyền ghi thư mục `server/uploads`. `404`: kiểm tra đúng backend và proxy. Nếu `POST` 201 nhưng `GET` 404, xác minh backend hiện tại lưu đúng thư mục uploads và port 4000 không bị bản cũ chiếm.

## 5. Luồng chấp nhận (sau khi schema đồng bộ)

TC-01 Customer đăng nhập, thêm thú cưng có ảnh, tải lại trang và nhìn thấy ảnh.
TC-02 Customer chọn dịch vụ + add-on + ngày/giờ còn chỗ → tiền mặt → đặt lịch. Admin thấy lịch chờ xác nhận.
TC-03 Admin cấu hình ngân hàng → khách chọn chuyển khoản → thông tin nhận tiền đúng; trạng thái chưa thanh toán đến khi đối soát.
TC-04 Admin xác nhận, tạo ca, phân công Staff; Staff chỉ xem lịch được giao.
TC-05 Check-in → ghi chú và ảnh chăm sóc → sẵn sàng → bàn giao → khách đánh giá.
TC-06 Yêu cầu hủy/đổi lịch, tiền thu và hoàn tiền phải giữ trạng thái độc lập.
TC-07 Quên mật khẩu gửi thật qua SMTP, dùng một lần 30 phút, đăng nhập lại thành công.

## 6. Kiểm chứng trong môi trường đóng gói

Chạy được `node --check server/src/server.js`, toàn bộ bài kiểm thử backend hiện có và TypeScript `transpileModule` kiểm tra cú pháp. **Chưa có môi trường PostgreSQL của người dùng và chưa thể chạy frontend production build do npm registry thiếu dependencies trong container.** Không được coi các bài kiểm thử đơn vị là xác nhận end-to-end.

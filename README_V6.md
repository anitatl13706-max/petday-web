# PETDAY V6 — Business specification + core source corrections

**Cơ sở:** bản PETDAY_OFFICIAL_Update (giai đoạn 004). Đây là **bản đặc tả V6 và mã nguồn nền được sửa**, KHÔNG phải lời khẳng định đã lập trình xong 35 chức năng.

## Đã sửa trực tiếp mã nguồn
- Lỗi `crypto.randomUUID()` chưa có namespace import → gọi đúng `randomUUID()`.
- CORS cho dev: các frontend cổng 8444, 8443, 5173; nếu triển khai thật, đặt `FRONTEND_ORIGIN` là origin thật (có thể nhiều origin ngăn dấu phẩy).
- `GET /api/public/services?q=&category=` tra cứu dịch vụ cơ bản không cần đăng nhập (dữ liệu catalogue còn ở rules.js).
- `GET /api/public/reviews` đọc đánh giá có lịch hoàn tất, không thêm dữ liệu mẫu.
- `DELETE /api/pets/:id` chỉ cho chính chủ xóa thú cưng CHƯA có lịch sử; để bảo toàn lịch sử khi đã có booking, trả 409. Giải pháp archive/soft-delete được thiết kế trong SPEC.

## Trạng thái
- Kiểm tra cú pháp server và chạy unit tests nếu có thể; **không** chứng nhận tích hợp PostgreSQL / frontend build / nghiệp vụ end-to-end nếu không có máy chủ thật.
- V6 full 35 chức năng được phân tích, phân kỳ trong `docs/PetDay_V6_SPEC.md` và `docs/PetDay_V6_Traceability.csv`.
- Không chạy lại SQL 001–004 trên database đang có. `database/005_v6_extension_DRAFT.sql` là bản **DRAFT CHƯA TRIỂN KHAI**; xem và rà soát kỹ trước khi thực thi, **không chạy thẳng vào database petday của bé**.

## Một thư mục duy nhất
Giải nén thư mục `PETDAY_OFFICIAL` này vào một vị trí cố định, copy `.env` cũ vào `server/.env`, dùng VS Code mở **chính thư mục có package.json**. Lần cập nhật sau nên dùng Git commit/patch, không tạo thư mục lồng. Backup pgAdmin trước mọi migration.

## Khởi chạy
Server: `cd server; npm install; npm run dev`. Frontend ở thư mục gốc: `npm install; npm run dev -- --port 8444` (nếu config Vite vẫn ép 8443, cần giải phóng cổng trước). Dev backend port 4000.

## Kiểm thử mã nguồn thực hiện trong môi trường biên soạn
- `node --check server/src/server.js`: PASS
- `node --test server/test/rules.test.js`: 5/5 PASS
- Chưa chạy PostgreSQL thật, chưa build frontend V6, chưa test trình duyệt. API mới cần kiểm thử riêng; dữ liệu catalog hiện từ `rules.js`, không được gọi là CRUD dịch vụ DB.

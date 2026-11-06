# PETDAY — GIAI ĐOẠN 2 · BACKEND + POSTGRESQL

**Trạng thái:** source đã triển khai; 5 unit tests nghiệp vụ PASS. Chưa kiểm thử end-to-end với PostgreSQL thật trong môi trường tạo gói. Cần chạy và kiểm tra trên máy người dùng.

## Những gì đã có

- Giữ nguyên trang chủ, Booking Wizard, trang lịch hẹn và Admin **prototype Figma Make**.
- Thêm khu vực **Nghiệp vụ thật · API** ở thanh trên trang chủ, URL `/#nghiep-vu-thuc`, thực hiện đăng ký/đăng nhập, hồ sơ thú cưng, đặt lịch, xem đơn, admin chuyển trạng thái, cập nhật care log và review.
- Backend Express tại `server/src/server.js`, PostgreSQL schema ở `database/002_phase2.sql`.
- Lưu dữ liệu qua API PostgreSQL; mã hóa mật khẩu bcrypt; token JWT có hạn 8 giờ; phân quyền role customer/admin; chủ chỉ thấy dữ liệu của mình; kiểm tra sở hữu Pet Profile.
- Backend tính lại **giá cơ sở và phụ phí cân nặng**, không tin số tiền từ client. Khóa giao dịch theo chi nhánh/ngày/giờ và kiểm tra sức chứa; hỗ trợ idempotency key, hạn chế đơn trùng.
- Trạng thái: Đang chờ xác nhận → Đã xác nhận → Đang thực hiện → Hoàn tất; admin có thể hủy Pending/Confirmed; khách tự hủy Pending. Có thể tạo ghi chú chăm sóc khi Completed và chỉ đánh giá một lần.
- Tách phần demo để không mạo nhận Wizard cũ là đã nối API. **Wizard gốc và Quản trị DEMO vẫn dùng localStorage và KHÔNG đồng bộ với PostgreSQL**.

## Chạy trên Windows (PowerShell)

### 1. Cài PostgreSQL và tạo database trống

Cài PostgreSQL 14+ và pgAdmin nếu chưa có. Trong pgAdmin: `Databases` → `Create` → `Database` → đặt tên `petday`.
Mở Query Tool tại DB `petday` và chạy **chỉ file `database/002_phase2.sql`**. Không chạy đồng thời file `001_booking_foundation.sql` vì là schema tham khảo phiên bản trước, khác tên bảng.

### 2. Backend — terminal số 1

```powershell
cd C:\DuongDan\PetDay_Phase2_v2\server
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

Sửa `DATABASE_URL` đúng user/password PostgreSQL của bé; sửa `JWT_SECRET` thành chuỗi ngẫu nhiên dài ít nhất 32 ký tự (PowerShell có thể chạy: `[guid]::NewGuid().ToString()+[guid]::NewGuid().ToString()`). Không chia sẻ file `.env` hay token.

Kiểm tra API `http://localhost:4000/api/health` phải có `{"ok":true,"mode":"postgresql"}`. Nếu lỗi, kiểm tra database và server terminal.

### 3. Frontend — terminal số 2

```powershell
cd C:\DuongDan\PetDay_Phase2_v2
npm install
npm run dev
```

Mở địa chỉ `Local:` được in ra trong terminal (không đoán cổng). Trên trang chủ nhấn **Nghiệp vụ thật · API**, hoặc mở `/#nghiep-vu-thuc` trên cùng domain.

### 4. Kiểm thử Customer

- Đăng ký với email thử nghiệm + mật khẩu từ 8 ký tự; tự đăng nhập.
- Tạo Pet Profile; chọn pet; chọn dịch vụ, chi nhánh, ngày tương lai và giờ hợp lệ.
- Xác nhận đơn; phải được mã `PD-...` và trạng thái `Đang chờ xác nhận`.
- Nhấn Làm mới; dữ liệu phải vẫn tồn tại trong database. Mở cửa sổ trình duyệt khác và đăng nhập cùng tài khoản để đối chiếu.

### 5. Tạo Admin *chỉ phục vụ bài demo*

Đăng xuất Customer, đăng ký tài khoản thứ hai với email thử nghiệm `admin@example.test`. Trong pgAdmin Query Tool chạy:

```sql
UPDATE users SET role='admin' WHERE email='admin@example.test';
```

Chỉ thực hiện khi đây là tài khoản kiểm thử của chính bé trong database **local**, không dùng trong môi trường thật. Đăng xuất, đăng nhập lại. Admin sẽ thấy lịch Customer và các nút chuyển trạng thái.

### 6. Kiểm thử Admin / Customer

- Admin xác nhận → bắt đầu → hoàn tất.
- Admin ghi nhật ký chăm sóc cho lịch hoàn tất.
- Customer đăng nhập lại, nhấn Làm mới, thấy trạng thái và nhật ký; gửi review 1 lần.
- Kiểm thử hủy lịch Pending, không cho Completed quay về Pending; hai khách cùng chi nhánh/giờ để test đầy chỗ.
- Chạy unit tests: `cd server; npm test`.

## Giới hạn có chủ ý

1. **Chưa kết nối trực tiếp Booking Wizard 4 bước và trang Admin DEMO gốc**. Khu vực API mới là nơi dùng dữ liệu thật. Bước kế tiếp là chuyển UI 4 bước sang các API và loại bỏ `localStorage` cho booking.
2. Add-on, Pet Taxi, sản phẩm kèm, voucher, đổi lịch, hoàn tiền thực tế chưa có trong backend. Giá mới chỉ gồm dịch vụ chính + cân nặng. Không diễn giải thành thanh toán thật.
3. Thanh toán chưa tích hợp nhà cung cấp: `payment_status` giữ “Chưa thanh toán”.
4. Đặt chỗ hiện tính đơn vị công suất theo chi nhánh/slot, chưa có lịch nhân viên hay thời lượng chồng lấp giữa các slot.
5. JWT lưu trong `sessionStorage` cho demo; production cần cookie HttpOnly, CSRF strategy, rate limiting, audit trail, HTTPS, quản trị secrets và cấu hình CORS theo môi trường.
6. Chưa có smoke test có PostgreSQL trong môi trường tạo gói. Không được ghi “end-to-end PASS” cho đến khi kiểm thử trên máy.

## BA ↔ Figma ↔ Code

- `AUTH-01` Đăng ký/đăng nhập: `LiveWorkspace.tsx`, `POST /api/auth/register`, `POST /api/auth/login`, `users`.
- `PET-01` Hồ sơ pet: `LiveWorkspace.tsx`, `GET/POST/PUT /api/pets`, `pets`.
- `BK-01` Đặt lịch: `LiveWorkspace.tsx`, `POST /api/bookings`, `bookings`, `line_items` JSONB.
- `BK-02` Kiểm tra chỗ: `GET /api/availability`, khóa giao dịch + công suất trong `POST /api/bookings`.
- `AD-01` Xác nhận/đang làm/hoàn tất: `PATCH /api/bookings/:code/status`.
- `BK-03` Khách hủy Pending: `PATCH /api/bookings/:code/cancel`.
- `CARE-01` Nhật ký: `PUT /api/bookings/:code/care`.
- `REV-01` Đánh giá: `POST /api/bookings/:code/review`.

**Quan trọng:** Figma Design chính thức và sơ đồ BA phải ghi các chức năng backend mới theo trạng thái thực tế, không đánh đồng với các màn hình Figma Make demo.

# PetDay V6.98–V6.99 — Bản chỉnh sửa tiếp theo (LOCAL TEST)

**Nguồn:** bản `PetDay_V6_97_DiaChiMacDinh_Bo2Nut.zip` do nhóm đã thử trên localhost.

## A. Các thay đổi đã thực hiện ở mã nguồn

1. **Điều hướng:** các mục `Quy trình`, `Về PetDay`, `Cẩm nang` trong header desktop/mobile điều hướng về đúng mục ở trang chủ, cuộn đến section, có gạch cam tại mục vừa chọn. Tránh dùng link `#quy-trinh` làm thay đổi route PetDay.
2. **Daycare cho chó và mèo:** đồng bộ danh mục frontend, rule tính giá/điều kiện backend và chatbot; thú cưng phải từ đủ 1 tuổi, không quá 30kg. Nhân viên cần bố trí khu vực theo loài. Gói nửa ngày 4 giờ, cả ngày 8 giờ, **trong ngày**, không phải lưu trú qua đêm.
3. **Giờ đưa đến – giờ đón về của Daycare:** ở bước chọn thời gian, khách chọn slot nhận như trước và giờ trả tối đa 4/8 tiếng theo gói, trước 20:00; thời gian được xác thực ở backend và lưu vào `line_items` trên lịch. Phí vẫn tính theo gói, không tự giảm vì nhận về sớm. Công suất được giữ theo **toàn thời lượng tối đa của gói** để bảo thủ; đây chưa phải hệ thống điều phối lưu trú theo từng phút.
4. **Add-ons:** thêm chăm sóc đệm chân, ảnh ngày, chải lông nhẹ, vệ sinh răng miệng cơ bản khi phù hợp, tổng tiền tính bằng backend, giới hạn tối đa 3 add-ons. Giao diện danh sách add-on gọn, nhấn mạnh giá và điều kiện; không tính trùng những thành phần vốn đã bao gồm trong gói.
5. **Số điện thoại:** đăng ký mới yêu cầu email và số điện thoại, đăng nhập dùng email **hoặc** số điện thoại kèm cùng mật khẩu, chuẩn hóa `0...`, `84...`, `+84...`, kiểm tra trùng số trên database. Có thể thêm số vào hồ sơ tài khoản cũ. **Chưa có OTP xác minh quyền sở hữu số thật hoặc giả lập**, vì không nên giới thiệu bảo mật OTP chỉ qua giao diện.
6. **QR mô phỏng 15 phút:** sau khi tạo lịch hoặc đơn cửa hàng chọn chuyển khoản, mở QR tham chiếu riêng của đơn. Mã QR hiển thị bộ đếm 15 phút tính theo thời điểm backend lưu trong PostgreSQL; khách gửi biểu mẫu **“Đã chuyển khoản · Chờ nhân viên xác nhận”** trong hạn. Hết hạn cần tạo phiên QR mới. Admin vẫn phải đối soát và xác nhận riêng; KHÔNG có ngân hàng thực, KHÔNG có auto-paid. QR chỉ chứa tham chiếu thử nghiệm, không phải QR ngân hàng/VietQR có thể dùng để chuyển tiền. Các đơn trước đó không được tự ghi đã thanh toán.
7. **Hồ sơ:** nếu dữ liệu cũ ở trường điện thoại là email hoặc dữ liệu hỏng, form không tự hiển thị nó như số điện thoại; người dùng nhập số hợp lệ.
8. **Health/schema:** bộ kiểm tra schema phát hiện thiếu các cột địa chỉ và bảng `payment_qr_sessions` mới, thay vì báo schemaReady:true dù API `/me` sẽ lỗi.

## B. Các hạng mục CHƯA hoàn thành / không được nhận là đáp ứng toàn bộ BR

- OTP email/SMS và xác minh số điện thoại như BR cũ: **chưa có**. Đăng nhập số dùng cùng mật khẩu và số đã liên kết, nhưng chưa có chứng minh số đã xác minh bằng OTP.
- Daycare qua đêm/nhiều ngày, quy đổi 24 giờ, nhiều ca chăm sóc trong lưu trú: **chưa có**. Bản này chỉ 4/8 giờ trong ngày.
- Pet Taxi chọn hai chiều, giá theo km thực tế, bắt đầu xe/hoàn thành chuyến và động bộ dịch vụ khi đổi lịch: **chưa cải tổ toàn bộ**.
- Quy tắc đặt cọc 20% theo lịch sử, giữ công suất trong 15 phút rồi tự hủy lịch nếu không thanh toán: **chưa có**. **15 phút ở đây là thời hạn QR báo chuyển khoản**, không phải cơ chế hủy lịch tự động. Không tự hủy các đơn cũ.
- Toàn bộ quy tắc đổi/hủy/hoàn với mốc 3 giờ / 24 giờ và tỷ lệ 80%/100%, các ca bất khả kháng và hủy nhiều đơn: **chưa được thay thế đầy đủ trong backend**, cần kiểm thử/đặc tả riêng.
- Thanh toán nhiều đơn cùng giao dịch, phân bổ voucher, ghi nhận cọc/phần còn lại: **chưa có**.
- QR chuyển tiền **thật** và thông báo giao dịch ngân hàng: **không có** trong đồ án; bản này chỉ mô phỏng kiểm thử.

Đây là **bản nâng cấp từng phần**, không phải chứng nhận đã hoàn tất toàn bộ chính sách người dùng gửi.

## C. Cập nhật database PostgreSQL LOCAL

**Quan trọng:** Chỉ dùng PostgreSQL local `petday/postgres@PostgreSQL 17`, không dùng nhầm Neon Online. Sao lưu `petday` trước khi sửa. Bản cũ đã được cập nhật `047_v697_default_customer_address.sql` (3 cột địa chỉ/điện thoại) theo các bước trước; không cần chạy lại nếu đã có.

1. Nếu chưa có 3 cột `default_address`, `contact_phone`, `default_delivery_zone` hãy chạy `database/047_v697_default_customer_address.sql`.
2. **Trước khi chạy 048**, kiểm tra số điện thoại đang bị trùng:

   ```sql
   SELECT contact_phone, COUNT(*)
   FROM public.users
   WHERE contact_phone IS NOT NULL AND contact_phone <> ''
   GROUP BY contact_phone HAVING COUNT(*) > 1;
   ```

   Nếu có dòng kết quả, cần đối chiếu người dùng và xử lý trùng trước; không xóa bừa.
3. Chạy `database/048_v698_phone_daycare.sql` để tạo unique index cho số điện thoại.
4. Chạy `database/049_v699_payment_qr_sessions.sql` để thêm bảng quản lý hạn QR.
5. Kiểm tra `http://localhost:4000/api/health/schema`: phải có `schemaReady:true`, `missing:[]`.

Không chạy 048/049 lên Neon production khi chưa có bản sao lưu, kiểm tra điều khoản thay đổi và kiểm thử localhost.

## D. Chạy source trên Windows

Mở VS Code từ thư mục `PETDAY_OFFICIAL`. Dùng **hai Terminal riêng**.

**Backend:**

```powershell
cd server
npm install
npm start
```

**Frontend** (Terminal thứ hai, từ thư mục `PETDAY_OFFICIAL`):

```powershell
npm install
npm run dev
```

Chọn đúng địa chỉ `Local:` do Vite hiện ra, đừng đoán cổng. Nếu cổng 4000 đã bị chiếm, kiểm tra tiến trình như các bước đã làm trước đó; không dừng tiến trình khác một cách tùy tiện.

**Thay đổi dependencies:** server có thêm npm package `qrcode`; **bắt buộc chạy `npm install` trong `server`** dù trước đó đã cài dependencies.

## E. Kiểm thử UAT ưu tiên

| TC | Kiểm thử | Kết quả kỳ vọng |
|---|---|---|
| NAV-01 | Ở Cửa hàng, chọn Quy trình | Về Trang chủ, cuộn đến Quy trình, gạch cam dưới tab |
| NAV-02 | Chọn Về PetDay, Cẩm nang | Cuộn đúng vùng, điều hướng không nhầm `hash` |
| PET-01 | Đặt Daycare cho mèo 2 tuổi, 4kg | Gói được chọn và báo giá hợp lệ |
| PET-02 | Đặt Daycare cho mèo 6 tháng | Backend từ chối theo điều kiện đủ 1 tuổi |
| DAY-01 | Chọn Daycare nửa ngày 08:30–12:30 | Chấp nhận; lưu vào line_items của đơn |
| DAY-02 | Chọn Daycare nửa ngày 08:30–15:30 | Backend từ chối quá thời lượng gói |
| ADD-01 | Chọn 3 add-on có hỗ trợ | Giá tính đúng ở backend, không chọn quá 3 |
| AUTH-01 | Đăng ký bằng email + số 0912345678 | Tạo một tài khoản, lưu `contact_phone` nếu chưa có trùng |
| AUTH-02 | Đăng nhập bằng +84912345678 và mật khẩu của cùng tài khoản | Truy cập đúng cùng một hồ sơ |
| AUTH-03 | Đăng ký lại số đã có | Trả lỗi trùng, không tạo tài khoản thứ hai |
| PAY-01 | Đặt lịch chuyển khoản thử nghiệm | Mã QR demo, hạn 15 phút và nút báo đã chuyển |
| PAY-02 | Gửi báo chuyển trong hạn | Chờ Admin xác nhận, không tự đánh dấu đã trả |
| PAY-03 | Hết hạn rồi bấm báo đã chuyển | Backend từ chối; cấp phiên mới nếu hợp lệ |
| PAY-04 | Admin xác nhận một lần | Ghi nhận tiền mô phỏng trong hệ thống, kiểm tra không trùng |
| SHOP-01 | Mua hàng giao tận nhà và sửa địa chỉ | Thông tin đơn lưu địa chỉ khách đã chọn, không tự sửa hồ sơ mặc định |

## F. Xác minh đã thực hiện trong môi trường tạo source

- `node --check` backend: đạt.
- Test backend không cần database thật: **196/196 đạt**.
- Kiểm tra cú pháp JSX/TSX của các file đã sửa bằng TypeScript transpilation: đạt.
- **Chưa thể hoàn thành `npm run build` frontend** do môi trường đóng gói chưa cài được toàn bộ frontend `node_modules`.
- **Chưa chạy E2E với PostgreSQL thực tế** hoặc kiểm tra giao diện trực quan bằng trình duyệt sau build. Cần thực hiện UAT ở local theo bảng trên trước khi deploy online.

## G. Bảo mật

Không đưa `server/.env`, SMTP secret, Neon/PostgreSQL credentials lên GitHub hay gửi cho bất kỳ ai. Nếu đã chia sẻ khóa SMTP hoặc mật khẩu PostgreSQL, hãy thu hồi/đổi các giá trị đó. QR nội bộ là **mô phỏng**, tuyệt đối không dùng để chuyển tiền thật.

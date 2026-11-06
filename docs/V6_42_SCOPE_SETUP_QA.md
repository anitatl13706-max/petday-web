# PetDay V6.42 — nâng cấp nghiệp vụ và mức độ hoàn thành

## Phạm vi hoàn thành bằng mã nguồn

1. **Giá 8 gói dịch vụ bằng PostgreSQL**. Admin có thể sửa `base_price` 8 gói được mã nguồn định nghĩa; giá mới có hiệu lực với báo giá và đặt lịch mới. Điều kiện thú cưng, thời lượng, mức chiếm công suất giữ nguyên theo `rules.js`. Lịch đã đặt lưu giá tại thời điểm mua trong `bookings.line_items` và `total`, không bị sửa khi Admin đổi giá.
2. **Đơn sản phẩm độc lập** (không cần đặt Grooming/Spa/Daycare) cho tài khoản Customer, **nhận hàng tại một trong 2 chi nhánh PetDay**. Backend xác minh sản phẩm, giá và tồn kho, khóa dòng trong giao dịch để tránh bán vượt, lưu `retail_orders`, `retail_order_items`, `retail_order_events`, sử dụng `idempotency_key`. Hủy đơn chưa thu tiền thì hoàn tồn một lần; đơn đã thu tiền không thể hủy thẳng. Admin xác nhận đơn → sẵn sàng bàn giao → hoàn tất; yêu cầu đã thanh toán trước khi hoàn tất. Cần đối soát tiền thực nhận trước khi ghi mã giao dịch. **Đây là luồng nhận tại cơ sở, chưa có giao hàng tận nhà hoặc xử lý trả hàng và hoàn tiền.**
3. **Quên mật khẩu**: API token 30 phút, dùng một lần và gửi qua SMTP đã có trong V6.41; V6.42 giữ nguyên bảo mật. Để email hoạt động thật, đơn vị triển khai phải cấu hình SMTP hợp lệ. Không gắn mật khẩu/SMTP giả vào ZIP.

## Chưa hoàn thành

- Admin **thêm/xóa tên gói** và thay đổi thời lượng, đối tượng phục vụ, bảng điều kiện giá. Chưa được xem là CRUD đầy đủ; hiện chỉ thay đổi giá 8 gói cố định. Cần refactor logic công suất, eligibility và các ràng buộc booking trước khi cho tạo gói tùy ý.
- Giao hàng tận nhà: chưa có địa chỉ giao, phí vận chuyển và điều phối giao nhận.
- Trả hàng: chưa có yêu cầu trả, kiểm tra điều kiện và hoàn tiền có ghi sổ riêng.
- Tự động kiểm tra biến động ngân hàng/VNPAY IPN và xác thực giao dịch thanh toán trực tuyến.
- Production build và E2E với PostgreSQL máy người dùng chưa được xác nhận.

## Nâng cấp an toàn

1. Backup PostgreSQL database `petday` bằng pgAdmin (Custom backup), xác nhận file backup có thể khôi phục.
2. **Không chạy lại SQL 001–024**. Mở `database/025_v642_service_prices_retail_orders.sql` và kiểm tra kết nối đúng `petday`, chạy 1 lần bằng Query Tool, xem `COMMIT` thành công. Nếu có lỗi, dừng tại lỗi đầu tiên.
3. Sao chép **chỉ file `server/.env` riêng** từ V6.41 đã chạy được (không chia sẻ cho người khác) vào V6.42. Dừng server và frontend cũ rồi `npm install`, `npm run dev` trong `server`, cũng như ở root. Kiểm tra `/api/health`, `/api/health/schema`.
4. Admin → Tài chính → Bảng giá dịch vụ: đổi giá một gói, refresh trang và tra lại bằng API báo giá; kiểm tra giá mới nhưng lịch cũ không đổi. Admin → Tài chính → Đơn bán lẻ độc lập: kiểm tra danh sách, duyệt, sẵn sàng, xác nhận thanh toán có tham chiếu thực, bàn giao.
5. Customer → Tài khoản → Mua sản phẩm riêng: chọn sản phẩm, địa điểm nhận, phương thức thanh toán và tạo đơn; kiểm tra stock giảm. Tạo đơn thứ hai khi stock không đủ phải bị từ chối. Hủy đơn chưa thu tiền, kiểm tra tồn kho tăng **một lần**. Không thử xác nhận thanh toán bằng mã giao dịch giả trên dữ liệu thật.

## SMTP quên mật khẩu

V6.41 đã có `POST /api/auth/forgot-password` và `/api/auth/reset-password` và bảo vệ token băm. Chỉ cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `RESET_BASE_URL` trong **server/.env cá nhân** với nhà cung cấp gửi email hợp lệ. Dùng mật khẩu ứng dụng hoặc credential SMTP được cấp; không dùng mật khẩu Gmail thông thường hay in token ra màn hình. Đặt `RESET_BASE_URL` trỏ đến frontend đang chạy, rồi khởi động lại backend. Kiểm tra `/api/health/features` và thực hiện một yêu cầu thật với email do mình kiểm soát. Đừng gửi `.env` hoặc link reset bí mật trong chat.

## Kiểm thử tự động

`cd server && npm test`: 131/131 test backend hiện có đạt ở môi trường tạo source. Test này **chưa kiểm chứng các API CRUD mới và PostgreSQL tích hợp**. `node --check server/src/server.js` đạt. TypeScript/TSX được kiểm tra cú pháp; cần `npm install && npm run build` tại máy có npm registry để xác nhận build.

# PetDay V6.9 – Ưu đãi được xác minh và thanh toán chuyển khoản có chỉ dẫn

## Tính năng triển khai
- API `GET /api/promotions/verify?code=...&petId=...&service=...` xem trước ưu đãi. Chỉ khách đăng nhập và chủ thú cưng mới sử dụng.
- `POST /api/bookings` xác minh mã lại trong transaction, khóa dòng khuyến mãi để giới hạn lượt, lưu `promo_code`, tổng tiền và dòng giảm giá.
- Mã ưu đãi có mức đơn tối thiểu, dịch vụ áp dụng, ngày hiệu lực, số lượt toàn hệ thống, giới hạn theo tài khoản.
- Giao diện nhập mã ưu đãi ở bước xác nhận. Giao diện Thanh toán của tôi hiển thị ngân hàng/số tài khoản/chủ tài khoản/nội dung chuyển khoản nếu đã cấu hình.
- Không tự nhận tiền chuyển khoản. Admin vẫn phải đối soát thực nhận; chưa có VietQR tự động, IPN, VNPAY, hoàn tiền tự động.

## Triển khai an toàn
1. Sao lưu database petday trong pgAdmin; đảm bảo bản 006 đã chạy.
2. Chạy duy nhất `database/007_promotions.sql` qua Query Tool của database `petday`.
3. Sao chép file `server/.env` đang hoạt động, KHÔNG đưa file này vào Git/ZIP.
4. Nếu muốn nhận tiền chuyển khoản, cấu hình `PETDAY_BANK_NAME`, `PETDAY_BANK_ACCOUNT`, `PETDAY_BANK_HOLDER` trong server/.env bằng tài khoản thật do người quản lý hợp pháp cung cấp. Khởi động lại API. Không dùng tài khoản giả.
5. Cài dependency trong `PETDAY_OFFICIAL/server` và `PETDAY_OFFICIAL`, chạy `npm run dev` ở hai terminal.
6. Tạo mã ưu đãi thử nghiệm bằng SQL ví dụ dưới đây (chỉ nếu muốn test):

```sql
INSERT INTO promotions(code,discount_type,discount_value,max_discount,min_order,service_name,starts_at,ends_at,max_uses,max_per_customer)
VALUES ('PETDAYTEST10','percent',10,50000,200000,NULL,now()-interval '1 day',now()+interval '30 days',20,1)
ON CONFLICT(code) DO NOTHING;
```

## Kiểm thử trọng yếu
- Mã hợp lệ được xem trước, đặt lịch tạo `promo_code`, `total` đã giảm, `line_items` có dòng âm.
- Mã hết hạn, chưa đủ tối thiểu, sai dịch vụ, hết lượt -> API trả 422. Gửi trực tiếp request giả sửa tiền không thể thay đổi tổng.
- Khách dùng cùng mã quá số lần -> bị từ chối. Khi hủy lịch, lần sử dụng được hoàn lại vào hạn mức đếm.
- Kiểm tra 2 khách cùng tranh lượt cuối để đảm bảo transaction không vượt giới hạn.
- Chọn chuyển khoản nhưng thiếu env -> API từ chối; có env -> thông tin chuyển khoản hiển thị tại trang thanh toán và trạng thái vẫn Chưa thanh toán.
- Không đánh dấu thành công trước khi nhân viên đối chiếu khoản nhận.

## Giới hạn còn tồn tại
- Chưa có màn hình Admin CRUD ưu đãi; Admin tạo mã qua pgAdmin.
- Chưa có QR VietQR hoặc gateway VNPAY; chưa có báo tiền về tự động.
- Bảng thông báo là tổng hợp trạng thái, chưa có unread/read receipt hoặc push.
- Chưa có bảng payment_transactions, lịch sử đối soát, chứng từ, refund; tính năng hiện tại không đủ chuẩn triển khai thật.
- Chưa có end-to-end test trên database của người dùng.

# V6_50 — Hướng dẫn làm PetDay Shop và chuyển khoản trên PostgreSQL TEST

## Cấu trúc SQL
- `database/030_v649_retail_delivery_and_full_catalog.sql` — thêm giao hàng và dữ liệu sản phẩm. Cần có bảng `retail_products`, `retail_orders` của SQL 024,025.
- `database/031_v650_bank_transfer_workflow_safety.sql` — chỉ tạo nếu thiếu các bảng `business_payment_settings`, `bank_transfer_notices`, `payment_events`.

## Trước khi chạy
1. **Sao lưu TEST** qua pgAdmin → Databases → đúng database → Backup → Custom.
2. Kiểm tra server `.env` trỏ đến đúng TEST, không phải production. Không chia sẻ file này.
3. Trong pgAdmin Query Tool chạy:
```sql
SELECT current_database() AS database_name;
SELECT to_regclass('public.retail_products') AS products,
       to_regclass('public.retail_orders') AS retail_orders,
       to_regclass('public.bookings') AS bookings,
       to_regclass('public.users') AS users;
```
Nếu thiếu products / retail_orders, **chưa chạy 030**. Hoàn tất 024 và 025 theo thứ tự trước, chỉ khi migration chưa từng chạy và đã sao lưu. Không chạy lại script nền tảng 001–009 một cách mù quáng.

## Thứ tự cấu hình
1. Chạy 030 trên TEST sau khi kiểm tra các tiền điều kiện.
2. Chạy 031 trên TEST (tương thích nếu 010/023 đã tồn tại).
3. Khởi động backend và frontend.
4. Đăng nhập Admin → Tài chính → Thiết lập ngân hàng. Nhập ngân hàng, STK, chủ tài khoản được phép sử dụng → Lưu.
5. Mở `/api/payment/options` và kiểm tra `bankTransfer.enabled: true` (không chứa thông tin bí mật).
6. Đăng nhập Customer → Đặt lịch → chọn Chuyển khoản ngân hàng → xác nhận lịch.
7. Customer → Lịch hẹn → Thanh toán: xem ngân hàng, STK, chủ tài khoản, số tiền, mã lịch; **chỉ chuyển tiền thử nghiệm nếu bạn kiểm soát tài khoản người nhận**.
8. Khách bấm Tôi đã chuyển khoản và thêm mã tham khảo/ghi chú tùy chọn. Lịch vẫn Chưa thanh toán.
9. Admin → Tài chính → Khách báo đã chuyển khoản → Sổ thu tiền. Chỉ khi đã đối chiếu bằng chứng tiền thực nhận, nhập mã giao dịch từ sao kê rồi Xác nhận đã nhận tiền.
10. Kiểm tra Customer chuyển sang Đã thanh toán và Admin Nhật ký đối soát có bản ghi.

## Trường hợp lỗi quan trọng
- Bank chưa cấu hình: website không cho khách chọn chuyển khoản.
- Thiếu bảng: xem `/api/health/schema`, `npm run db:doctor`, sau đó áp dụng đúng migration thiếu.
- Khách thông báo đã chuyển: **không tự cập nhật đã thanh toán**.
- Mã giao dịch được dùng lại cho lịch khác: backend từ chối với HTTP 409.
- Trạng thái đã thanh toán: backend từ chối thu trùng.
- Chưa tích hợp API ngân hàng hoặc IPN; tất cả đối soát là thủ công.

## Hướng dẫn kiểm thử không chuyển tiền thật
Trong DB TEST, có thể diễn tập các bước tạo thông báo và trạng thái Chưa thanh toán; phần ghi nhận Đã thanh toán chỉ thử với dữ liệu giao dịch giả được ghi rõ là môi trường TEST. Không nhập thông tin tài khoản ngân hàng của người khác.

# PetDay V6.72 — Kiểm tra và nghiệm thu (PostgreSQL TEST)

## Sửa luồng
- Taxi đã bàn giao: ẩn nút **Khách không đến**; backend cấm ghi nhận no-show nếu Taxi đã bàn giao.
- No-show chỉ áp dụng cho lịch xác nhận, sau giờ hẹn 30 phút, khi chưa check-in và chưa có Taxi bàn giao.
- Cửa hàng, đơn giao tận nhà: Chờ xác nhận → Đã xác nhận → Đóng gói / Sẵn sàng bàn giao → Đang giao → Giao thành công. Không tự hoàn tất khi xác nhận thu tiền.
- Đơn nhận tại quầy: Chờ xác nhận → Đã xác nhận → Sẵn sàng nhận → Khách nhận hàng. Không có bước đang giao.
- Thanh toán tiền mặt / chuyển khoản mô phỏng được xác nhận riêng trước khi hoàn tất; không dùng tiền thật trong demo.

## Cảnh báo schema (gặp lỗi đỏ khi vào Đơn cửa hàng)

Trong **pgAdmin Query Tool mới**, chạy SQL *chỉ đọc* dưới đây để kiểm tra:

```sql
SELECT to_regclass('public.retail_orders') AS orders_table;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='retail_orders'
AND column_name IN ('delivery_eta','fulfillment_method','delivery_zone','status')
ORDER BY column_name;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid='public.retail_orders'::regclass AND contype='c';
```

Nếu chưa có `delivery_eta` hoặc constraint `status` chưa cho `shipping`, hãy **sao lưu TEST, đối chiếu migration 039_v667_retail_delivery_status.sql** rồi mới chạy một lần. Không chạy lại SQL 001–038. Nếu pgAdmin báo `25P02`, mở Query Tool mới hoặc chạy `ROLLBACK;` trước; phải xem lỗi đầu tiên chứ không suy luận từ `25P02`.

## Test thao tác
1. Lịch Taxi đã bàn giao tại cơ sở: không thấy nút khách không đến; API no-show trả 409.
2. Lịch xác nhận chưa đến giờ: bấm ghi no-show trả lý do chưa đủ 30 phút (không đóng lịch).
3. Đơn giao tận nhà pending: Admin bấm Xác nhận đơn, Đã đóng gói.
4. Nhập ngày giao dự kiến và bấm Bàn giao vận chuyển, đơn chuyển Đang giao.
5. Sau khi khách nhận hàng, ghi nhận thanh toán (nếu tiền mặt), bấm Giao thành công.
6. Đơn nhận tại quầy không thấy nút Đang giao, chỉ có xác nhận đã nhận tại quầy.
7. Customer xem lịch sử mua và trạng thái tương ứng.

Kiểm thử mã nguồn không thay thế việc chạy end-to-end với PostgreSQL TEST trên máy người dùng.

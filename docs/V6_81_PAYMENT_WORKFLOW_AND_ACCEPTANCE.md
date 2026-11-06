# PetDay V6.81 — Thanh toán nhất quán (dịch vụ và cửa hàng)

## Phạm vi

Kế thừa source V6.80; cải thiện lựa chọn tiền mặt / chuyển khoản ở cả hai luồng, thẻ thông tin thanh toán, thông báo khách đã chuyển và màn Admin. Trạng thái giao hàng hoặc chăm sóc **không** tự đổi khi xác nhận thanh toán.

Giao diện không lặp từ “demo” trên nút thao tác. **Không che giấu tính chất thử nghiệm**: khi `PETDAY_DEMO_PAYMENT=true`, website có thông báo ngắn “Thanh toán thử nghiệm — không chuyển tiền thật” và hiển thị mã phi ngân hàng `KHONG-CHUYEN-TIEN`, không có QR thanh toán thật.

## Cấu hình chế độ thử nghiệm

Sao chép `PETDAY_OFFICIAL/server/.env` từ V6.80 và thêm hoặc kiểm tra:

```dotenv
PETDAY_DEMO_PAYMENT=true
```

Giữ nguyên `DATABASE_URL` và `JWT_SECRET` hợp lệ. KHÔNG gửi hai giá trị này vào tin nhắn hay commit lên Git.

Sau đó khởi động lại Backend. Phương thức chuyển khoản chỉ mở nếu Backend trả `bankTransfer.enabled=true` ở `/api/payment/options`.

## Database

**Cần sao lưu PostgreSQL TEST trước khi chạy migration mới.**

`database/042_v681_retail_transfer_notices.sql` bổ sung bảng `retail_transfer_notices` lưu thông báo chuyển khoản cho đơn Cửa hàng. Không tự đánh dấu đơn đã thanh toán, không xóa đơn cũ.

Yêu cầu có sẵn `retail_orders` (SQL 025). Để giao tận nhà dùng `shipping` và `delivery_eta` vẫn cần cấu trúc SQL 039 đã được áp dụng từ trước. Các cột `pets.archived_at`, `pets.gender` của các phiên bản 040/041 vẫn cần hiện diện nếu đang dùng các chức năng đó.

Không chạy lại loạt migration cũ một cách tùy tiện. Nếu Query Tool báo transaction đang aborted, mở Query Tool mới hoặc ROLLBACK trước khi kiểm tra.

## Luồng A — Dịch vụ

1. Customer chọn thú cưng, dịch vụ, ngày giờ và tiền mặt hoặc chuyển khoản.
2. Backend tính giá; khi có mã lịch, khách mở `Tài khoản > Lịch hẹn > Thanh toán của tôi`.
3. Khách báo chuyển khoản → `bank_transfer_notices`; lịch vẫn `Chưa thanh toán`.
4. Admin xem `Tài chính > Khách báo chuyển khoản`, đối chiếu theo quy trình thử nghiệm và vào `Sổ thu tiền` xác nhận.
5. Thanh toán mới thành `Đã thanh toán`; không thay đổi duyệt lịch, Taxi, bắt đầu hoặc hoàn tất chăm sóc.

## Luồng B — Đơn cửa hàng

1. Customer chọn sản phẩm, hình thức nhận tại quầy / giao tận nhà và tiền mặt / chuyển khoản.
2. Backend kiểm tra tồn kho, giá và tạo mã đơn.
3. Với chuyển khoản, lịch sử mua hàng mở để khách bấm `Tôi đã chuyển khoản`.
4. Backend ghi vào `retail_transfer_notices`. Admin xem dấu `Khách đã báo chuyển khoản` trong `Đơn cửa hàng`.
5. Admin nhập mã đối soát nội bộ rồi bấm `Xác nhận đã thu tiền`. Chỉ khi đó cột `payment_status` được cập nhật thành `paid`.
6. Đơn chuyển `Đã xác nhận -> Sẵn sàng -> Đang giao / Chờ nhận -> Hoàn tất` độc lập với thanh toán.

## Các test case cần chạy trên máy có PostgreSQL TEST

- [ ] T01 Dịch vụ — tiền mặt đặt được; không tự đánh dấu đã thanh toán.
- [ ] T02 Dịch vụ — chuyển khoản chọn được khi cờ chế độ thử nghiệm bật.
- [ ] T03 Dịch vụ — khách báo đã chuyển; vẫn chưa thanh toán.
- [ ] T04 Dịch vụ — Admin xác nhận một lần, không xác nhận trùng.
- [ ] T05 Dịch vụ — trả tiền trước không tự đổi trạng thái dịch vụ/Taxi.
- [ ] T06 Cửa hàng — nhận tại quầy, tiền mặt.
- [ ] T07 Cửa hàng — giao tận nhà, tiền mặt.
- [ ] T08 Cửa hàng — nhận tại quầy, chuyển khoản.
- [ ] T09 Cửa hàng — giao tận nhà, chuyển khoản.
- [ ] T10 Cửa hàng — khách báo đã chuyển, Admin thấy thông báo; chưa tự đánh dấu đã thu.
- [ ] T11 Cửa hàng — Admin xác nhận thanh toán, người mua xem Đã thanh toán sau khi tải lại.
- [ ] T12 Cửa hàng — không chấp nhận báo chuyển khoản với đơn tiền mặt/đã trả/đã hủy.
- [ ] T13 Giao hàng — thanh toán không tự làm thay đổi trạng thái đang giao.
- [ ] T14 Phân quyền — Customer không thể gọi API xác nhận thanh toán của Admin.
- [ ] T15 Sau khi restart trang, thông báo và trạng thái vẫn lưu.
- [ ] T16 Chưa chạy SQL 042 thì thông báo báo lỗi rõ, không tạo thanh toán giả thành công.
- [ ] T17 Không có số tài khoản/QR có thể chuyển tiền thật trong chế độ thử nghiệm.

## Chưa được xác nhận trong môi trường tạo source

Kiểm tra tự động Backend và cú pháp TSX đã qua, nhưng chưa chạy E2E với PostgreSQL của bé. Việc cập nhật thực tế không tự thực hiện trên máy người dùng.

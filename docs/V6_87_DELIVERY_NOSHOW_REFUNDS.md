# PetDay V6.87 — Giao thất bại, khách không đến & hoàn tiền

## Thiết lập (PostgreSQL TEST)
1. **Sao lưu database TEST trước** khi chạy migration; không cập nhật vào database production.
2. Phải có migration V6.86 trước đó, đặc biệt 039 (delivery), 042, 043 (thông báo chuyển khoản).
3. Trong pgAdmin, chọn đúng database `petday` TEST, mở nội dung `database/044_v687_delivery_exceptions_retail_refunds.sql` và chạy **một lần**. Migration thêm `retail_delivery_events`, `retail_refund_requests` và các trạng thái bán hàng mới, không xóa đơn cũ.
4. Copy `server/.env` của V6.86 hoạt động sang V6.87. Khởi động tại thư mục ngoài cùng bằng `powershell -ExecutionPolicy Bypass -File .\START_PETDAY_V687.ps1` (đóng bản cũ trên cổng 4000/8443 trước).
5. Chạy `cd PETDAY_OFFICIAL\server; npm test` và kiểm tra Backend console không có lỗi schema. Không chạy lại toàn bộ SQL cũ.

## Nghiệp vụ Cửa hàng (Admin → Đơn Cửa hàng)
- Đơn **giao tận nhà** ở trạng thái `Đang giao`: nhập lý do ≥8 ký tự, bấm **Ghi nhận giao thất bại**. **Không tự nhập kho, không hoàn tiền**.
- Trạng thái `Giao thất bại`: nhập ngày mới và lý do để **Giao lại**, hoặc **Ngừng giao · Chờ hàng hoàn**.
- Khi hàng thực sự đã về, chọn có nhập lại kho hay không sau khi kiểm tra hàng, rồi bấm **Xác nhận đã nhận hàng hoàn**. Chỉ tăng tồn kho một lần, khi checkbox hàng đủ điều kiện bán được tích. Không tự nhập kho hàng hỏng/mở niêm phong.
- Đơn **đã ghi nhận thu tiền**: sau khi hàng hoàn, tạo đúng một hồ sơ hoàn tiền `pending`; không sửa số tiền đã thu, không tự hoàn tiền.
- Đơn chưa thu: không tạo yêu cầu hoàn tiền; tình trạng được giữ trong lịch sử.

## Nghiệp vụ Dịch vụ
- Admin ghi nhận **Khách không đến** trên lịch Đã xác nhận, chưa check-in và chưa nhận Pet Taxi tại cơ sở.
- Lịch bị đóng `Đã hủy` với `noShowReason` có lưu; lịch sử thanh toán **không thay đổi**.
- Nếu đã thu tiền, tự tạo **hồ sơ xét hoàn tiền** ở trạng thái `pending` để Admin quyết định theo chính sách. Không tự hoàn hoặc khấu trừ.
- **Đổi lịch sau khi vắng mặt** hiện là trường hợp cần CSKH trao đổi và xử lý theo quy trình riêng; V6.87 **chưa tự động tạo lịch thay thế**, nhằm tránh dùng lại tiền hoặc phân công trùng slot.

## Tài chính → Hồ sơ hoàn tiền
- 2 tab **Dịch vụ** / **Cửa hàng**, lọc ưu tiên hồ sơ `pending`, `approved`.
- `pending → approved` (nhập số tiền, lý do nếu hoàn một phần), hoặc `pending → rejected` (nhập lý do).
- `approved → completed` **chỉ sau khi đã xử lý tiền hoàn** (hoặc ghi nhận giao dịch mô phỏng), có mã tham chiếu ≥4 ký tự. Không thể hoàn hai lần.
- Phía khách: Cửa hàng → Lịch sử mua hiển thị khoản hoàn; dịch vụ hiển thị ở Yêu cầu hoàn tiền cũ.
- Demo/test: phần mềm **không thực hiện chuyển tiền ngân hàng**. Không gắn tài khoản ngân hàng thực hoặc khai rằng người mua đã nhận tiền nếu chưa kiểm chứng.

## Kiểm thử đầu cuối trên PostgreSQL TEST (chưa được xác nhận trong môi trường phát hành)
1. Đơn giao tận nhà + tiền mặt → `shipping` → `delivery_failed` → `shipping` → `completed`, cần thu tiền trước khi hoàn tất.
2. Đơn chuyển khoản đã thanh toán → `shipping` → `delivery_failed` → `return_pending` → `returned` → hồ sơ hoàn → duyệt hoàn toàn bộ → hoàn tất có mã tham chiếu.
3. Giao thất bại **không tự cộng kho**; chọn nhận hàng hoàn và checkbox kho **cộng đúng một lần**. Không chọn checkbox thì kho không cộng.
4. Không cho `shipping → completed` nếu chưa ghi nhận thanh toán.
5. Không cho xác nhận hoàn tiền lần hai; không cho hoàn vượt tổng đơn.
6. Lịch Đã xác nhận & đã thanh toán, chưa check-in → Khách không đến → hồ sơ hoàn ở Tài chính → xét hoàn.
7. Lịch đã check-in / Taxi đã bàn giao không thể đánh dấu Khách không đến.
8. Khách không thể gọi API Admin để xác nhận giao hàng hoặc hoàn tiền.

**Còn ngoài phạm vi V6.87:** tự động giao lại theo định tuyến hãng vận chuyển, thu phí giao lại, cấp lịch dịch vụ mới sau no-show và tái sử dụng tiền thanh toán, xử lý hoàn tiền ngân hàng thật. Cần thiết kế và kiểm thử riêng trước khi mở cho kinh doanh thực tế.

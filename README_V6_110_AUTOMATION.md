# PetDay V6.110 – Xác nhận tự động trong môi trường TEST

## Đã triển khai
- Khi đặt lịch đáp ứng điều kiện công suất, PostgreSQL lưu trạng thái **Đã xác nhận** ngay. Trạng thái thanh toán vẫn độc lập.
- **Chỉ khi `PETDAY_DEMO_PAYMENT=true`**: khách mở QR mô phỏng 15 phút rồi nhấn **Xác nhận thanh toán thử nghiệm**; backend kiểm tra chủ lịch, phiên QR còn hạn, chưa báo trước đó, khóa dòng booking, ghi một biên nhận DEMO và cập nhật trạng thái ngay, không qua Admin. Cọc 20% tiền mặt vẫn được ghi là cọc; phần còn lại chưa thanh toán.
- Chế độ không demo: nhấn 'Tôi đã chuyển khoản' chỉ ghi nhận thông báo; phải xác minh giao dịch qua nguồn tin cậy mới được ghi nhận đã thanh toán.
- Hủy lịch đủ điều kiện: đã tự động hủy và tự phê duyệt khoản hoàn theo chính sách, không có thao tác duyệt.
- Đổi lịch >3 giờ / >1–3 giờ đã tự thay đổi ngày giờ khi còn công suất. Trong vòng 1 giờ và trễ giờ là ngoại lệ theo chính sách, nhân viên xem xét. **Daycare đổi lịch vẫn chưa tự chỉnh giờ về**, nên không quảng cáo là đã hỗ trợ.
- Hoàn phí Taxi đã tự tạo khoản hoàn được duyệt khi sự kiện đã được xác minh; tiền hoàn thực tế chưa tự chuyển.
- Admin mục Tài chính trong chế độ demo: báo cáo chỉ đọc, không có nút duyệt/ghi nhận hoàn tiền.

## Chạy trên máy Windows (hai PowerShell)

PowerShell 1 (frontend, từ thư mục PETDAY_OFFICIAL): `npm install` rồi `npm run dev`.

PowerShell 2 (backend, từ PETDAY_OFFICIAL\server):

```powershell
$env:PORT = 4001
$env:PETDAY_DEMO_PAYMENT = 'true'
npm install
npm start
```

**Cực kỳ quan trọng:** chỉ bật `PETDAY_DEMO_PAYMENT=true` trên **database TEST biệt lập**, không dùng với cơ sở dữ liệu hoặc tài khoản nhận thanh toán ngân hàng thật. Chỉ dùng QR mô phỏng và tuyệt đối không chuyển tiền thật. Không cần chạy migration mới để thử lịch mới.

Nếu muốn nối chuyển khoản ngân hàng thật và chuyển hoàn tự động phải tích hợp callback/webhook được ký từ nhà cung cấp thanh toán và API chuyển hoàn; chức năng đó CHƯA tồn tại.

## Kiểm thử
1. Tạo tài khoản thử và thú cưng thử. Đặt Spa bằng chuyển khoản mô phỏng; lịch mới phải **Đã xác nhận**, thanh toán **Chưa thanh toán**.
2. Mở QR, nhấn **Xác nhận thanh toán thử nghiệm**; một biên nhận `DEMO-PD-...` được lưu, thanh toán thành **Đã thanh toán**, không có thao tác Admin.
3. Hủy lịch trong khoảng đủ điều kiện; trạng thái chuyển **Đã hủy** và tạo hồ sơ hoàn **approved** theo mức chính sách, không phải completed.
4. Vào Admin / Tài chính; kiểm tra báo cáo giao dịch, không còn nút **Duyệt hoàn** / **Xác nhận thanh toán** trong chế độ demo.
5. Thử đổi lịch khi còn >3 giờ, >1–3 giờ; kiểm tra ngày giờ lưu. Đổi sát giờ là yêu cầu cần nhân viên hỗ trợ, theo chính sách đã cung cấp.
6. Không chạy thử những thao tác này trên dữ liệu thật.

## Giới hạn
- Không thực hiện chuyển tiền hoàn trong ngân hàng; trạng thái approved nghĩa là **đủ điều kiện hoàn / chờ chuyển tiền**, không được hiển thị là đã gửi tiền.
- Thanh toán mô phỏng do khách bấm nút không chứng minh giao dịch ngân hàng thật.
- Đơn cửa hàng (retail) vẫn có các quy trình riêng, chưa tự động hóa toàn bộ.
- Các yêu cầu cũ đã tồn tại trước nâng cấp có thể còn pending và cần xử lý/chuyển dữ liệu có kiểm soát; bản này không tự sửa lịch sử hay giả mạo giao dịch cũ.

## Lịch pending từ phiên bản trước

Dùng `database/058_v6110_review_legacy_pending.sql` để **xem trước** các lịch cũ đang pending, không thực thi cập nhật. Không có thay đổi database tự động cho các lịch cũ; chỉ lịch tạo mới được xác nhận ngay.

# PetDay V6.19 — Hoàn tiền và đối soát

## Nghiệp vụ đã bổ sung
- Khách có lịch **đã thanh toán** và đã hoàn tất/đã hủy có thể gửi một yêu cầu hoàn tiền kèm lý do; cùng lịch không thể gửi nhiều yêu cầu để tránh trùng lặp.
- Admin duyệt hoặc từ chối (bắt buộc ghi lý do khi từ chối). Duyệt KHÔNG tương đương đã hoàn tiền.
- Sau khi tiền thực sự được hoàn bên ngoài hệ thống, Admin nhập mã giao dịch hoàn/phiếu chi và xác nhận. Máy chủ lưu dấu vết, thời gian và tài khoản xử lý.
- Khách theo dõi trạng thái và nhận thông báo trong tài khoản. Tiền hoàn chỉ được trừ vào thu ròng khi trạng thái hoàn thành.
- Không thay đổi payment_status của booking để giữ nguyên sự thật đã từng thu tiền. Không tự thực hiện chuyển khoản.

## Quy trình
Customer → gửi phiếu → pending → Admin approve/reject → approved → tiền hoàn ngoài hệ thống → Admin nhập tham chiếu và complete → lịch sử & thông báo.

## Kiểm tra bắt buộc (sau khi backup)
1. Chạy `database/016_v619_refund_reconciliation.sql` đúng database `petday`, không chạy lại toàn bộ migrations.
2. `/api/health/schema` phải trả `schemaReady: true`.
3. Tạo lịch, thu tiền bằng phương thức phù hợp; hoàn tất quy trình hoặc hủy, sau đó đăng nhập Customer và gửi yêu cầu hoàn tiền.
4. Gửi trùng cùng lịch phải bị từ chối 409.
5. Admin từ chối thiếu lý do → lỗi 400; duyệt → trạng thái approved, tổng hoàn vẫn không tăng.
6. Admin complete không có mã tham chiếu → lỗi 400; có mã và xác nhận thực tế → completed; tổng hoàn tăng đúng bằng số tiền thực hoàn ghi nhận.
7. Customer khác không xem hoặc tạo yêu cầu cho booking không thuộc mình.
8. Kiểm tra cùng lúc bấm complete nhiều lần: chỉ một cập nhật thành công.
9. Sau complete, xem thông báo, nhật ký và thống kê thu ròng.

## Giới hạn có chủ đích
- Đang hỗ trợ hoàn **toàn bộ** cho một lịch; hoàn một phần và nhiều đợt hoàn cần thiết kế sổ cái riêng.
- Đây là workflow thủ công có kiểm soát, không có kết nối ngân hàng, webhook, VNPAY hay tự động xuất tiền.
- `grossReceived` là tổng số tiền *đánh dấu đã thanh toán*, không phải sao kê ngân hàng hay doanh thu theo chuẩn kế toán. Số liệu là cộng dồn.
- Hệ thống có thể cần quy trình nghiệp vụ riêng với lịch no-show, tranh chấp đã hoàn tất, hoặc thanh toán phát sinh sau hủy; không giả định hoàn tiền được áp dụng cho mọi trường hợp.

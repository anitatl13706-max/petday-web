# PetDay V6_82 — Duyệt hủy lịch & hoàn tiền

## Phạm vi

- Chỉ áp dụng cho yêu cầu hủy **lịch đã xác nhận, chưa bắt đầu**, có quyết định Admin.
- Duyệt hủy lịch đã có trạng thái **Đã thanh toán**: trong **cùng transaction PostgreSQL**, tạo một hồ sơ `refund_requests` trạng thái `pending`, kèm thông báo tới khách. Không tự xác nhận đã hoàn tiền.
- Admin tại **Lịch hẹn → Duyệt yêu cầu hủy lịch** có thể duyệt hoàn toàn bộ/một phần, từ chối hoàn có lý do, hoặc ghi nhận đã hoàn sau khi nhập mã đối soát.
- Khách theo dõi tại **Yêu cầu hoàn tiền**. Nhật ký `refund_events` được ghi khi Admin quyết định; không hoàn trùng hay hoàn quá số đã thu.
- Hủy lịch chưa thanh toán không tạo hồ sơ hoàn.
- Không tích hợp ngân hàng; hành động ghi nhận hoàn tất trong bản thử nghiệm **không chuyển tiền thật**.

## Database

Cần các migration PetDay đã có: `016_v619_refund_reconciliation.sql` và `020_v628_cancellation_review.sql` (cùng các migration phụ thuộc trước đó). V6_82 **không cần migration mới** nếu bảng refund_requests, refund_events đã tồn tại. **Sao lưu DB TEST trước**, không chạy lại hàng loạt SQL và không xóa dữ liệu.

## Test tay

1. Lịch đã thanh toán, xác nhận, chưa bắt đầu: khách gửi yêu cầu hủy; Admin ghi lý do tối thiểu 8 ký tự rồi duyệt.
2. Lịch thành `Đã hủy`, có đúng một phiếu hoàn `pending`.
3. Admin chọn 100% hoặc nhập tiền hoàn nhỏ hơn tổng + ghi lý do, bấm `Duyệt hoàn tiền` → `approved`.
4. Nhập mã đối soát tối thiểu 4 ký tự và bấm `Xác nhận đã hoàn tiền` → `completed`; tải lại không mất dữ liệu.
5. Bấm hoàn lại không được. Đổi mã đối soát trùng cũng không hợp lệ.
6. Trường hợp không hoàn: nhập lý do tối thiểu 8 ký tự, bấm `Không hoàn tiền`.
7. Lịch chưa thu tiền được duyệt hủy: không có nút hoàn tiền.
8. Duyệt hủy bị lỗi (ví dụ thiếu bảng refund_requests) phải rollback cả thay đổi trạng thái hủy. Kiểm tra `/api/health/schema`.
9. Tài khoản khách chỉ xem yêu cầu của mình, không gọi được API Admin.

## Chạy

Sao chép `PETDAY_OFFICIAL/server/.env` từ V6_81 (không ghi đè cơ sở dữ liệu), dừng tiến trình PetDay cũ trên 4000/8443 rồi chạy `START_PETDAY_V682.ps1` ở thư mục ngoài cùng.

## Giới hạn

Chưa thực hiện end-to-end trực tiếp trên PostgreSQL máy người dùng. `npm test` chỉ xác nhận logic Backend được test; không phải bằng chứng tích hợp ngân hàng hay chuyển hoàn thực tế.

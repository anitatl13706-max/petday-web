# PetDay V6.104 — Admin vận hành và Pet Taxi tinh gọn

## Thay đổi
- Ẩn tab Nhân viên và xóa thông tin phân công ở thẻ lịch hẹn; không xóa bảng nhân viên hay dữ liệu phân công cũ.
- Admin duyệt lịch trực tiếp, không còn tự phân công nhân viên; Check-in thú cưng vẫn là điều kiện bắt buộc để bắt đầu dịch vụ.
- Khi Admin xác nhận khách không đến, Admin hủy hoặc khách hủy lịch chờ duyệt: tất cả chiều Taxi **chưa xuất phát** (`requested`, `confirmed`) được đóng `cancelled` và ghi sự kiện, không để lại trạng thái Chờ xác nhận. Chuyến đang di chuyển / hoàn tất không bị tự đóng.
- `refund_due` ghi **khoản dự kiến đối soát**, không ghi đã hoàn tiền. Chiều đã xuất phát cần xử lý riêng, không tự quyết toán.
- Hệ thống vẫn giữ tài khoản staff và schema cũ để tương thích dữ liệu; đây là tối giản giao diện và luồng vận hành, chưa loại bỏ quyền staff cũ hoàn toàn.

## Kiểm thử
1. Admin duyệt lịch nhưng không phân công nhân viên vẫn có thể xác nhận pet đã đến → bắt đầu dịch vụ.
2. Trước Check-in, API từ chối bắt đầu dịch vụ.
3. Hủy/No-show lịch có Taxi chiều đón và chiều về chưa xuất phát: hai lượt chuyển `cancelled`, khách không còn thấy `requested`.
4. Taxi đã bắt đầu hoặc hoàn thành không bị tự hủy; khoản phí đó đòi hỏi đối soát riêng.
5. Sau khi tải lại, customer/admin cùng thấy các trạng thái.
6. Các luồng đặt lịch, QR, đổi/hủy lịch, cửa hàng phải được kiểm thử hồi quy trên máy có PostgreSQL.

Không cần migration mới nếu database đã chạy 051, 052. Sao lưu trước khi chạy kiểm thử tình huống hủy lịch.

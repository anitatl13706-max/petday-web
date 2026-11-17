# PetDay V6.132 — các chỉnh sửa đã triển khai

- Khách: bỏ khối “Việc cần thực hiện” và dòng giải thích Thanh toán/QR/hoàn tiền trùng lặp.
- Khách: thông báo sắp xếp mới nhất; xóa từng thông báo hoặc xóa các thông báo đã đọc. API yêu cầu token và lọc user_id; xóa thông báo không xóa lịch/giao dịch. Không cần migration SQL mới.
- Tiền mặt: khi người vận hành chọn Hoàn tất, xác nhận đã thu đủ phần còn lại hoặc hủy thao tác. Backend từ chối `check_out` nếu tiền chưa xác nhận; ghi receipt và chuyển hoàn tất trong một transaction.
- Tự đóng: kiểm tra lại ngay trước API danh sách lịch, ngoài lịch chạy 15 phút và khi server khởi động; nhận diện bằng các sự kiện tiếp nhận thực tế. Tôn trọng ngày kết thúc của Daycare và các trường hợp có Taxi đã bàn giao.
- Tự hoàn tất cuối ngày không tạo biên nhận tiền mặt vì không có xác nhận thực thu.

## Chạy

Cần PostgreSQL TEST đã cập nhật migration 063 và 064 như bản V6.131. Giữ `PETDAY_AUTO_CLOSE_ENABLED=true` trong server/.env để bật xử lý cuối ngày. Thận trọng: trên database TEST có lịch cũ quá hạn, server sẽ tự đóng khi khởi động hoặc khi truy vấn danh sách.

Frontend: tại PETDAY_OFFICIAL chạy `npm install` rồi `npm run dev`.
Backend: tại PETDAY_OFFICIAL/server chạy `npm install` rồi `npm start` (PORT=4001).

## Kiểm thử

1. Mở lịch khách, không còn mục Việc cần thực hiện hoặc hướng dẫn trùng.
2. Tài khoản -> Thông báo, xóa một; tải lại; xóa đã đọc và xác nhận thông báo chưa đọc còn.
3. Lịch tiền mặt Đang thực hiện, chưa thu: bấm Hoàn tất, Cancel => giữ nguyên; OK => trạng thái Hoàn tất, receipt đúng phần còn thiếu.
4. Lặp request Hoàn tất không tạo receipt trùng.
5. Lịch Đã xác nhận quá ngày, không ghi pet đến => No-show nếu backend bật auto close; tải lại phải cập nhật.
6. Lịch Đang thực hiện quá ngày => Hoàn tất nhưng không tự thu tiền mặt.
7. Daycare nhiều ngày chưa tới ngày trả => không tự đóng.

Chỉ chạy thử trên DB TEST; chưa chạy tích hợp với cơ sở dữ liệu trên máy người dùng.

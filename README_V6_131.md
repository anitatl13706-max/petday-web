# PetDay V6.131 — Tối giản điều hành

## Đã chỉnh
- Bỏ panel đối soát tập trung khỏi trang Lịch hẹn Admin; không xóa backend hoặc lịch sử thanh toán. Các khoản thu dịch vụ tiếp tục được xử lý theo từng lịch.
- Bỏ panel cấu hình khóa khung giờ khỏi trang Lịch hẹn thường ngày, giữ các API và dữ liệu khung giờ đã khóa.
- Bỏ khối “Cần xử lý trước” trên Tổng quan; vẫn giữ Lịch làm việc trong ngày.
- Bỏ tab “Cần xử lý đặc biệt” khỏi Đơn cửa hàng; đơn giao thất bại/chờ hàng hoàn được hiển thị ngay trong “Đang xử lý”, giữ các nút xử lý thực tế.

## Những phần cố ý không tự đổi trạng thái
- “Đang chờ xác nhận” có thể là đơn đang chờ thanh toán cọc/đủ tiền: không được tự xác nhận trước khi nhận tiền theo quy tắc đang có.
- “Hoàn tất nhưng chưa thu tiền” vẫn cần đối soát thực thu từ chi tiết lịch; không tự ghi đã thu tiền mặt.
- Các lịch tự động No-show/Hoàn tất của V6.128 tiếp tục hoạt động nếu PETDAY_AUTO_CLOSE_ENABLED không phải false và migration 064 đã áp dụng.
- Không thay đổi dữ liệu PostgreSQL và không thêm migration mới.

## Kiểm tra cần thực hiện trên PostgreSQL TEST
- Tổng quan không còn “Cần xử lý trước”; Lịch hẹn không còn panel đối soát tập trung và khóa giờ.
- Các đơn giao thất bại/chờ hoàn hàng vẫn xuất hiện trong “Đang xử lý” và có thao tác xử lý tương ứng.
- Kiểm tra xác nhận cọc, quá hạn QR, tự No-show, tự Hoàn tất và xử lý tiền thực thu ở đơn cụ thể.
- Lưu ý: cập nhật bản này không tự sửa những đơn chờ thanh toán đã tồn tại từ các phiên bản cũ.

# PetDay V6.65 — Trung tâm quản lý chung (Admin / Staff)

## Phạm vi
- Admin và nhân viên dùng cùng cổng “Trung tâm quản lý PetDay”, nhưng **tài khoản và quyền hạn riêng**.
- Admin: **Lịch & phân công** chứa lập ca, phân công nhân viên, duyệt lịch và điều phối.
- Nhân viên: cùng cổng nhưng chỉ hiển thị lịch được giao và nhật ký phục vụ. Backend kiểm tra phân công trước khi chấp nhận ghi mốc chăm sóc.
- Quản trị sản phẩm đã tách vào **Sản phẩm & kho**: tìm kiếm, lọc, thêm/sửa, ngừng bán; chỉ xóa sản phẩm chưa có giao dịch.
- Chuyển khoản DEMO (nếu bật cờ): không kết nối ngân hàng, không dùng tiền thật.

## Nguyên tắc trạng thái
1. Admin xác nhận lịch + phân công nhân viên phù hợp với ca, chi nhánh và khung giờ.
2. Nhân viên tiếp nhận (**check_in**) -> hệ thống chuyển lịch sang **Đang thực hiện**.
3. Nhân viên cập nhật chăm sóc -> sẵn sàng bàn giao -> bàn giao (**check_out**) -> **Hoàn tất**.
4. Đối soát thanh toán chỉ đổi **payment_status**, không tự tạo bước phục vụ/Pet Taxi.
5. Sau giờ hẹn ít nhất 30 phút, một lịch **Đã xác nhận** chưa check-in có thể ghi **Khách không đến**, kể cả đã thanh toán. Dữ liệu payment_status vẫn được giữ nguyên, khoản hoàn phải xử lý bằng quy trình hoàn tiền riêng. Lưu lý do + người thao tác.
6. Pet Taxi đón thất bại không tự đồng nghĩa khách không đến. Xác minh và ghi chú trước khi đóng lịch.

## Cấu hình chuyển khoản mô phỏng (tùy chọn)
Trong file `PETDAY_OFFICIAL/server/.env` của máy TEST, thêm dòng `PETDAY_DEMO_PAYMENT=true`, sau đó khởi động lại backend. Customer sẽ thấy tài khoản DEMO và cảnh báo **không chuyển tiền thật**. Tắt bằng `false` khi cần cấu hình ngân hàng thật. Không chèn hoặc công khai `.env` vào ZIP. Đây chỉ là mô phỏng: thao tác xác nhận tiền không chứng minh tiền đã chuyển.

## Kiểm thử nghiệm thu trên máy (chưa thể xác nhận ở môi trường này)
- Đăng nhập Admin: mở Lịch & phân công, tạo ca, phân công lịch đã xác nhận.
- Đăng nhập Staff bằng tài khoản khác: chỉ xem lịch được giao, không vào Tài chính, Sản phẩm hoặc các lịch không được giao.
- Staff check-in: Đang thực hiện; chăm sóc/ready/check-out: Hoàn tất.
- Đánh dấu khách không đến ở lịch đã thanh toán: cần quá 30 phút, chưa check-in; không tự thay đổi trạng thái thanh toán.
- Đánh dấu không đến ở lịch đã check-in hoặc chưa tới giờ: backend từ chối.
- Ngừng bán và thử xóa sản phẩm: có lịch sử thì phải giữ lại; chưa phát sinh giao dịch có thể xóa.
- Demo payment: API `/api/payment/options` phản hồi `bankTransfer.demo=true` sau khởi động lại backend.

## Lưu ý dữ liệu
Không chạy lại SQL 001–021 và không xóa PostgreSQL. Chép `.env` và thư mục `server/uploads` từ bản đang chạy tốt. Các mục liên quan bảng mới phải được kiểm tra schema trước.

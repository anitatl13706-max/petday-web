# PetDay V6.7 — Sửa điều hướng và các luồng còn thiếu

## Đã cập nhật source
- Menu Admin: Quản lý lịch hẹn, Yêu cầu tư vấn, Duyệt đổi lịch đặt mục tiêu cuộn tới đúng khu vực của Portal; menu Customer có mục tiêu Hồ sơ, Thú cưng, Lịch hẹn, Tư vấn.
- Menu sử dụng cùng style và các khu vực có `scroll-mt-32` khi nhấn menu.
- Nút chuyển carousel lời nhận xét hoạt động. **Nhận xét hiện là nội dung minh họa, không phải đánh giá khách hàng được xác minh.**
- Nút Câu chuyện PetDay bật/tắt phần nội dung thay vì cuộn vào một đoạn luôn mở.
- Đổi tên khu vực Tư vấn, nêu rõ là yêu cầu hỗ trợ bất đồng bộ, không phải chat nhân viên trực tuyến.
- Đổi tên form yêu cầu đổi lịch cho dễ hiểu.

## Chưa được coi là hoàn thiện
1. Quản trị: Cần thiết kế trang điều hành riêng dựa trên PostgreSQL, không nhầm với `Admin.tsx` prototype lưu localStorage.
2. Thanh toán: Không tự hiển thị QR khi chưa có tài khoản ngân hàng thật được cấu hình; không tự đổi trạng thái Đã thanh toán khi khách chọn chuyển khoản.
3. Đối soát: Thêm payment_transactions, payment_events, phương thức, số tiền, chứng từ/định danh, tác nhân và thời điểm xác minh; kiểm tra bất biến tổng tiền.
4. Khách tra cứu thanh toán/đánh giá: Tách tab Lịch hẹn, Thanh toán, Đánh giá, Hỗ trợ rõ ràng. Các bản ghi hiện vẫn chung phần lịch hẹn.
5. Đánh giá: Chỉ nhận sau Hoàn tất, 1 lần/lịch, nội dung từ dữ liệu thật; cần API list đánh giá đã duyệt trước khi đưa ra trang chủ.
6. Hoàn tiền: Điều kiện hủy/đổi lịch, phân biệt yêu cầu/đang xử lý/đã hoàn; theo dõi giao dịch và kiểm toán.
7. Quên mật khẩu: SMTP có thật và bài test email/reset token hết hạn, không lộ email tồn tại.
8. Nhắc lịch: background job có hàng đợi và chống gửi trùng; chỉ sau khi đã xác nhận lịch.
9. Trạng thái dịch vụ: Nhận bé/check-in, phân công nhân viên, đang chăm sóc, hoàn tất, bàn giao/check-out; mỗi bước có thời gian & người thao tác.
10. Tư vấn: Dòng thời gian phản hồi, thông báo khi có phản hồi, giới hạn spam và giao diện hộp thư.
11. Bổ sung Pet Taxi/add-on/sản phẩm theo đơn hàng, lưu giá chốt từng dòng, kiểm tra tồn và phạm vi dịch vụ tại backend.

## Kiểm thử gợi ý
- Đăng nhập Admin, mở menu và thử 3 mục; phải điều hướng đúng khu vực ngay cả khi đang ở trang admin.
- Mở homepage, bấm hai mũi tên đánh giá; phải xoay thứ tự ba thẻ.
- Bấm Câu chuyện PetDay hai lần, nội dung mở và đóng tương ứng.
- Tài khoản khách bấm Yêu cầu tư vấn; phải thấy hộp thư, không nhầm với lịch hẹn.
- Test chức năng chưa hoàn thành không được tính PASS.

## Cài đặt
Bộ ZIP là toàn bộ source để phục hồi. Trên máy Windows mở `PETDAY_OFFICIAL` (chứa `package.json`); chạy frontend trong thư mục này, backend trong `PETDAY_OFFICIAL/server`. Giữ bản backup SQL và `.env` riêng. Không chạy lại migration cũ. Không chia sẻ hoặc đóng gói `.env` có thông tin thật.

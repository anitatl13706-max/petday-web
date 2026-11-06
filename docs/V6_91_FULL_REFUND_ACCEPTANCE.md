# PetDay V6_91 — Hoàn 100% khi đã thu tiền nhưng chưa cung cấp dịch vụ/hàng hóa

## Chính sách nghiệp vụ đã chốt
- Dịch vụ đã ghi nhận thanh toán nhưng bị hủy trước khi chăm sóc hoặc khách không đến (không có check-in/Pet Taxi bàn giao): mở **một** hồ sơ hoàn đủ 100% tiền đã ghi nhận.
- Lịch chuyển khoản đã được ghi nhận tiền **nhưng Admin chưa duyệt**: khách có thể gửi yêu cầu hủy; Admin chấp thuận sẽ mở hồ sơ hoàn tiền.
- Đơn Cửa hàng đã ghi nhận thanh toán nhưng **khách chưa nhận**, kể cả đơn chưa xác nhận: Customer gửi yêu cầu hủy, Admin chấp thuận sẽ mở hồ sơ hoàn 100%.
- Hàng đã xuất đi và khách từ chối nhận: Admin ghi giao thất bại, xử lý hàng hoàn; khi xác nhận đã nhận hàng hoàn và khoản thu tồn tại thì tạo hồ sơ hoàn 100%.
- Admin hủy trực tiếp lịch đã thu tiền khi chưa bắt đầu: tạo hồ sơ hoàn 100%, không xóa bản ghi khoản thu.
- Luồng tiền mặt chưa thu: không tạo khoản hoàn tiền.
- Hồ sơ hoàn tiền **pending → approved → completed**; completed là ghi nhận sau khi Admin xử lý, không có kết nối ngân hàng thực hiện chuyển tiền tự động.
- Backend chặn hoàn một phần/từ chối hồ sơ khi lịch đã hủy hoặc đơn đã hủy/hoàn hàng. Không cho hoàn trùng khi một lịch/đơn đã có hồ sơ.
- Giao dịch đã hoàn tất cung cấp dịch vụ hoặc đã bàn giao hàng: không tự mặc định hoàn, cần quy trình khiếu nại/đổi trả riêng.

## Thay đổi giao diện
- Admin Tài chính → Hồ sơ hoàn tiền: hiển thị ngày lập hồ sơ, nêu rõ nghĩa vụ hoàn 100%, ẩn phần chỉnh số tiền/từ chối cho hồ sơ đã hủy/chưa thực hiện; giữ nút Duyệt hoàn → Xác nhận đã hoàn.
- Admin Tài chính → Dịch vụ/Cửa hàng: hiển thị ngày khách báo chuyển và ngày đơn tạo khi chờ xác nhận.
- Customer lịch đã trả trước còn chờ duyệt: có nút yêu cầu hủy để được xét hoàn thay vì nút hủy tức thời gây mất hồ sơ hoàn tiền.

## Trước khi chạy
1. Sao lưu PostgreSQL TEST, giữ nguyên dữ liệu cũ. Bản này không tạo migration SQL mới, nhưng các migration hoàn tiền và yêu cầu hủy 016, 020, 044, 046 phải có.
2. Sao chép `PETDAY_OFFICIAL/server/.env` từ V6_90 (không phát tán file .env).
3. Dừng phiên PetDay cũ chiếm cổng 4000 và 8443 rồi chạy PowerShell script từ thư mục ngoài.
4. Kiểm tra `/api/health/schema`, đăng nhập cả Customer và Admin.

## UAT ưu tiên
1. Chuyển khoản dịch vụ, Admin xác nhận tiền, chưa duyệt lịch → Customer yêu cầu hủy → Admin duyệt → Tài chính có đúng một hồ sơ 100%.
2. Chuyển khoản dịch vụ, đã duyệt nhưng chưa check-in → hủy → hồ sơ 100%.
3. Chuyển khoản dịch vụ, khách không đến, chưa Pet Taxi bàn giao → hồ sơ 100%.
4. Đơn Cửa hàng đã thanh toán nhưng vẫn pending → Customer yêu cầu hủy → Admin duyệt → hồ sơ 100%.
5. Đơn đã giao đi, khách từ chối nhận, hàng hoàn về → hồ sơ 100%.
6. Admin duyệt hoàn → Admin ghi nhận đã hoàn → Customer kiểm tra trạng thái và giá trị sau reload.
7. Bấm duyệt/hoàn hai lần, hoàn vượt/hoàn thiếu, Customer gọi API Admin → bị từ chối.
8. Tiền mặt chưa thu bị hủy → không có hồ sơ hoàn.

**Giới hạn:** Không kiểm thử được kết nối PostgreSQL máy người dùng hoặc chuyển tiền ngân hàng thật trong môi trường build. Test đơn vị chỉ kiểm tra hàm nghiệp vụ; xác nhận end-to-end cần thực hiện trên máy dùng PostgreSQL TEST.

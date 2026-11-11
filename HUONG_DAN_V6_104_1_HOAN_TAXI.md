# PetDay V6.104.1 — Hoàn phí Pet Taxi theo từng chiều

## Cần làm trước khi sử dụng
1. Sao lưu PostgreSQL local `petday` (pgAdmin Backup dạng Custom).
2. Chỉ trên database local đã cập nhật 051 và 052, chạy `database/053_v61041_taxi_refund_ledger.sql` **một lần** trên pgAdmin Query Tool.
3. Chép `server/.env` từ V6.104 đang chạy; không đưa file `.env` lên GitHub.
4. Chạy `npm install && npm start` tại `PETDAY_OFFICIAL/server` và `npm install && npm run dev` tại `PETDAY_OFFICIAL` ở hai Terminal.
5. Kiểm tra `http://localhost:4000/api/health/schema` cho đến khi `schemaReady:true`. Nếu sai schema, kiểm tra tên database trước, đừng chạy SQL cũ hàng loạt.

## Quy trình trên website
- Customer chỉ thấy tình trạng và khoản hoàn chiều đón/chiều về trong **Tài khoản → Hoàn tiền → Hoàn phí Pet Taxi**.
- Admin vào **Quản trị → Tài chính → Hoàn phí Taxi theo từng chiều**.
- Nếu Taxi chiều đón được khách chủ động bỏ trước khi xe xuất phát, hoặc PetDay không thể phục vụ, hoặc chiều về được hủy trước khi xe xuất phát, hệ thống ghi **phí hoàn dự kiến** vào hồ sơ chiều Taxi; điều này không tự động hoàn tiền.
- Nếu chưa ghi nhận thu tiền, Admin không tạo hồ sơ hoàn (chỉ ghi nhận miễn/giảm phí).
- Khi đã ghi nhận thu tiền và còn ngân sách hoàn trên lịch: (1) **Tạo hồ sơ hoàn** → (2) **Duyệt hoàn** → (3) sau khi xử lý thực tế, nhập mã đối soát và **Xác nhận đã hoàn**.
- Một chiều Taxi chỉ có một hồ sơ, không ghi nhận hai lần; mã đối soát phải khác mã đã dùng.
- Khi khách vắng mặt đúng quy trình, phí chiều đón không được hoàn mặc định, lịch chăm sóc vẫn chưa tự hủy.
- Lịch hủy / No-show đóng Taxi chưa xuất phát; Taxi đang chạy cần xử lý riêng.

## Tránh hoàn trùng tiền
V6.104.1 tạo *sổ hoàn Taxi độc lập*, đồng thời giới hạn **tổng hồ sơ hoàn đang xử lý + đã hoàn trên cùng lịch ≤ tổng thanh toán đã ghi nhận**. Với hồ sơ hoàn dịch vụ cũ đã dành toàn bộ tiền hóa đơn, Admin sẽ thấy thông báo cần đối soát trước khi mở hoàn Taxi. **Không chỉnh sửa/xóa thủ công các khoản hoàn cũ khi chưa rà soát sổ thu chi**.

Đối với hồ sơ hủy mới, cơ sở tính hoàn dịch vụ loại trừ mục Taxi và hàng mua kèm. Nếu có khuyến mãi, khoản giảm được tính bảo thủ vào phần dịch vụ; những trường hợp hóa đơn cũ phức tạp cần Admin xem lại trước khi quyết toán.

## Test kiểm tra ưu tiên
1. Khách tự đưa pet đến, Taxi chiều đón chưa xuất phát → có phí hoàn dự kiến; dịch vụ vẫn giữ lịch.
2. Lịch đã thu tiền, Admin tạo hồ sơ Taxi → duyệt → nhập mã hoàn → Customer thấy Đã ghi nhận hoàn.
3. Admin xác nhận hoàn hai lần → hệ thống chặn.
4. Lịch chưa thu tiền → không tạo hoàn tiền.
5. Taxi hai chiều: chỉ hủy chiều đón → chiều về vẫn giữ để phục vụ.
6. Lịch hủy có hồ sơ hoàn dịch vụ gần bằng tổng hóa đơn → không thể tạo hồ sơ Taxi khiến tổng vượt tiền đã thu.
7. Khách vắng mặt → không tự tạo hoàn 100%.
8. Check-in vẫn bắt buộc trước khi bắt đầu chăm sóc; dịch vụ và Taxi không tự đổi trạng thái lẫn nhau.

**Giới hạn:** đây là sổ đối soát và xác nhận mô phỏng, KHÔNG thực hiện chuyển khoản/hoàn tiền qua ngân hàng. Chưa có kiểm thử end-to-end với PostgreSQL và giao diện trên máy người dùng.

# PetDay V6.104.11 — Taxi theo lịch dịch vụ, chờ bàn giao pet

## Những điểm đã thay đổi
- Customer không phải chọn ngày hoặc giờ Taxi thứ hai. Taxi theo **ngày lịch chăm sóc**; giờ thực tế xe xuất phát ghi theo thao tác **Bắt đầu chuyến**, không suy diễn xe đã đi từ giờ hẹn.
- Phần điều phối Taxi Admin không yêu cầu nhập giờ thủ công khi **Xác nhận Taxi**; mốc giờ hẹn là thông tin tham chiếu, không phải ETA cam kết.
- Admin **Hoàn tất chăm sóc**: `check_out` được lưu, lịch vẫn trong nhóm **Chờ bàn giao pet** (trạng thái cơ sở dữ liệu tạm là `Đang thực hiện`).
- Khi không có Taxi chiều về: Admin xác nhận **Đã bàn giao pet trực tiếp cho khách**, bắt buộc ghi tên/thông tin người nhận. Sau đó lịch chuyển `Hoàn tất`.
- Khi có Taxi chiều về: chỉ được **Bắt đầu chuyến chiều về** khi đã hoàn tất chăm sóc. Khi **Hoàn tất · Đã bàn giao pet**, backend lưu mốc bàn giao và đóng lịch.
- Nếu đã đặt Taxi về nhưng khách đến nhận, phải **hủy/đóng chiều về hợp lệ** trước khi bấm bàn giao trực tiếp; phí được miễn/giảm hoặc xét hoàn theo trạng thái thực tế.
- Trong Admin Lịch hẹn, có lọc **Chờ bàn giao** và những lịch này được ưu tiên ở danh sách **Đang xử lý**; Customer cũng thấy tiến trình **Chờ bàn giao**.
- Không thay đổi bảng thu/hoàn tiền, công thức 100–50–0 hay dữ liệu hóa đơn đã xác nhận.

## Cài đặt local (bắt buộc vì có mốc mới)
1. Dừng các Terminal cũ; sao lưu PostgreSQL `petday` local trên pgAdmin 4.
2. Mở `PETDAY_OFFICIAL/database/056_v610411_handoff_after_care.sql` trong Query Tool của **đúng database local `petday`**, chạy một lần và xác nhận thành công. KHÔNG chạy trên Neon/production khi đang thử local.
3. Sao chép `server/.env` từ phiên bản đang hoạt động trước đó; không đưa `.env` lên web.
4. Trong thư mục `PETDAY_OFFICIAL/server`: `npm install` rồi `npm start`.
5. Trong thư mục `PETDAY_OFFICIAL`: `npm install` rồi `npm run dev`.
6. Mở lại localhost do Vite in ra; dùng Ctrl+Shift+R nếu còn cache.

## 3 bài test cần thực hiện (lịch MỚI)
- **T1 Không Taxi về:** duyệt, check-in, bắt đầu, hoàn tất chăm sóc → phải thấy **Chờ bàn giao**, KHÔNG phải **Hoàn tất**. Nhập thông tin người nhận, bấm **Đã bàn giao pet trực tiếp** → chuyển **Hoàn tất**; F5 vẫn đúng.
- **T2 Taxi hai chiều:** hoàn tất chiều đón, check-in, chăm sóc xong → vẫn **Chờ bàn giao**. Xác nhận, bắt đầu, hoàn tất Taxi chiều về → mới chuyển **Hoàn tất**. Không sinh khoản hoàn ngoài ý muốn.
- **T3 Taxi về bị hủy trước khi xe đi:** chăm sóc xong → Admin xử lý hủy chiều về, rồi bàn giao trực tiếp → Hoàn tất. Chênh lệch phí xem tại Hóa đơn & đối soát; chưa thu thì giảm hóa đơn, đã thu dư thì Tài chính xét hoàn. Không xác nhận giao pet qua Taxi khi thực tế khách tự đến.

## Phạm vi kiểm tra đã thực hiện
- Node.js syntax backend đạt; 274/274 bài test backend hiện có đạt, gồm 5 test quy tắc bàn giao mới.
- 35/35 file TS/TSX được phân tích cú pháp thành công bằng TypeScript.
- Chưa build Vite đầy đủ do môi trường thiếu gói npm và cache offline; chưa kiểm thử với PostgreSQL trên máy người dùng. Cần thực hiện 3 bài test local bên trên trước khi xác nhận triển khai thành công.

## Dữ liệu lịch đã hoàn tất trong phiên bản cũ
- Migration **không sửa** trạng thái và lịch sử của lịch cũ. Để kiểm tra luồng mới, nên tạo lịch thử mới.

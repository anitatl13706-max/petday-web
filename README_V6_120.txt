PETDAY V6.120 — CHÍNH SÁCH HỦY/HOÀN, BỎ BƯỚC CHỜ BÀN GIAO VÀ CĂN CHỈNH GIAO DIỆN

Nguồn: V6.119. Không cần migration SQL mới nếu database TEST đã được cập nhật đến V6.117.

CHÍNH SÁCH HỦY DỊCH VỤ (KHÔNG GỘP PHÍ TAXI):
- Chưa có tiền thực thu: hủy lịch chưa bắt đầu, không phát sinh khoản hoàn.
- Khách mới chỉ cọc 20%: khách hủy thì cọc không được hoàn.
- Khách đã thanh toán toàn bộ và chưa từng đổi lịch theo yêu cầu khách: nếu hủy sớm hơn 1 giờ trước giờ hẹn, quyền hoàn 80% phần chăm sóc đã trả; còn tối đa 1 giờ thì không cho tự hủy, liên hệ nhân viên.
- Đã đổi lịch thành công theo yêu cầu khách: nếu tiếp tục tự hủy thì không hoàn.
- Khách không đến: Admin xác minh và đóng sau khi kết thúc ngày hẹn; không hoàn tiền chăm sóc.
- PetDay không thể phục vụ, không sắp xếp được lịch thay thế: quyền hoàn 100% số thực thu có thể hoàn theo từng cấu phần dịch vụ/Taxi.
- Taxi có chính sách riêng theo từng chiều, không áp lại tỷ lệ 80% của dịch vụ chăm sóc.
- Không tạo giao dịch hoàn tiền ngân hàng thật chỉ bằng thao tác giao diện. Chỉ xác nhận thực hoàn khi có kết quả giao dịch hợp lệ; giao dịch DEMO ở database TEST được đánh dấu riêng.

THAY ĐỔI NGHIỆP VỤ:
- Cho phép khách tự hủy lịch chưa thanh toán/đang chờ thanh toán nếu chưa chăm sóc, thay vì HTTP 409 cũ.
- Tự tính tiền hoàn từ biên nhận thực thu, lịch sử đổi do khách, thời điểm hủy, khoản Taxi đang được dành hoàn.
- Bỏ bước 'Chờ bàn giao' khỏi tiến trình dịch vụ; Taxi được theo dõi ở luồng riêng.
- Khi hoàn tất chăm sóc: nếu đã thu đủ thì lịch hoàn tất. Nếu chưa, Admin ghi nhận tiền mặt để hệ thống chốt hoàn tất.
- No-show: Admin chỉ ghi nhận sau khi hết ngày hẹn.
- Căn lại nhóm nút góc trên, bỏ lựa chọn Chờ bàn giao trong thống kê và bộ lọc.
- Vô hiệu hóa chức năng khôi phục hồ sơ hoàn tiền tự động cũ để tránh hoàn sai theo chính sách trước.

KHỞI ĐỘNG WINDOWS:
1. Giải nén ZIP, vào thư mục PETDAY_OFFICIAL.
2. Sao lưu PostgreSQL và kiểm tra server/.env trỏ đúng database TEST.
3. Đóng đúng backend PetDay cũ ở cổng 4001; không dừng tùy tiện dự án khác.
4. PowerShell 1 trong PETDAY_OFFICIAL: npm install ; npm run dev
5. PowerShell 2 trong PETDAY_OFFICIAL/server: npm install ; $env:PORT=4001 ; $env:PETDAY_DEMO_PAYMENT='true' ; npm start
   Chỉ bật PETDAY_DEMO_PAYMENT trên DATABASE TEST RIÊNG.
6. Mở địa chỉ Vite công bố (thường http://localhost:5173).

CÁC CA KIỂM THỬ:
A. Lịch chờ thanh toán ban đầu, chưa bắt đầu: hủy được, hoàn 0.
B. Lịch đã cọc 20%: hủy được trước giờ hẹn, hoàn cọc 0.
C. Lịch trả đủ, còn 90 phút: hủy tự động và quyền hoàn 80% phần chăm sóc thực thu.
D. Lịch trả đủ, còn đúng 60 phút: không tự hủy; cần liên hệ nhân viên.
E. Lịch khách đã đổi thành công: hủy sau đổi, hoàn 0.
F. Admin ghi No-show trước kết thúc ngày hẹn phải bị chặn; sau ngày hẹn được kiểm tra tiếp.
G. PetDay không thể phục vụ: phần chăm sóc và Taxi tính/đối soát riêng, tổng hoàn không vượt thực thu.
H. Admin bắt đầu → Hoàn tất chăm sóc: không còn nhãn Chờ bàn giao; nếu chưa thu đủ, thu tiền mặt rồi chốt lịch.

KIỂM THỬ THỰC HIỆN Ở MÔI TRƯỜNG SOẠN BẢN:
- npm test backend: 323/323 đạt, gồm 8 ca chính sách V6.120.
- node --check server/src/server.js: đạt.
- TypeScript/TSX parsing: đạt (Portal.tsx, BookingJourney.tsx).
- Build frontend và tích hợp PostgreSQL trực tiếp: CHƯA được xác minh do phụ thuộc npm/front-end chưa cài được trong môi trường này.

LƯU Ý: Việc có 'Hoàn tất' không tự đồng nghĩa thú cưng đã nhận bởi khách. Bàn giao/thực hiện Taxi vẫn cần sự kiện thực tế riêng. Các bản ghi cũ cần đối chiếu thủ công, không chỉnh/hủy hàng loạt.

# PetDay V6.71 – Rà soát nghiệp vụ phân công, Taxi và hủy lịch

## 1. Phân công
- Vào Quản trị > Nhân viên. Nút **Rà soát phân công (N chờ)** vẫn bấm được khi N=0 và báo không có lịch cần phân công.
- Khi N>0, thao tác rà soát chỉ gán nhân viên phù hợp, không tạo trùng phân công. Kiểm tra lịch đã gán ở danh sách bên dưới.
- Việc đổi nhân viên thủ công vẫn kiểm tra đúng chi nhánh và trùng thời gian trên server.

## 2. Pet Taxi
- Trước khi duyệt lịch: chưa hiện nút xác nhận bàn giao.
- Sau khi duyệt lịch, Admin có một nút **Xác nhận đã đón và bàn giao**. Đây là sự kiện THỰC TẾ, không phải nút xác nhận đặt trước xe.
- Không còn ràng buộc giờ hẹn để hiển thị nút. Chỉ bấm sau khi việc đón và bàn giao tại cơ sở đã xảy ra; popup yêu cầu xác nhận.
- Trạng thái Taxi độc lập với thanh toán và trạng thái chăm sóc.
- Nếu chưa đón được khách, không bấm xác nhận thành công; xử lý hủy lịch hoặc ghi nhận không đến khi đủ điều kiện.

## 3. Khách không đến
- Chỉ hợp lệ cho lịch đã xác nhận, chưa bắt đầu chăm sóc và đã quá giờ hẹn ít nhất 30 phút (giờ Việt Nam).
- Nhập lý do tối thiểu 8 ký tự trực tiếp trong thẻ lịch, bấm Ghi nhận khách không đến.
- Khi quá sớm, UI báo điều kiện rõ ràng. Không đổi trạng thái vì bấm thử.
- Khi thành công, lịch thành **Đã hủy**, giải phóng người phụ trách; giữ nguyên trạng thái thanh toán.

## 4. Khách hủy lịch
- Lịch đang chờ xác nhận: khách tự hủy trực tiếp.
- Lịch đã xác nhận và còn trước ngày hẹn: bấm **Yêu cầu hủy lịch** trên thẻ để chuyển đến biểu mẫu, nhập lý do từ 10 ký tự.
- Admin nhận yêu cầu, nhập lý do xử lý từ 8 ký tự và chọn **Chấp thuận hủy** hoặc **Từ chối**.
- Chấp thuận: lịch thành **Đã hủy**, nhân viên được giải phóng, Taxi chưa hoàn tất bị hủy, khách nhận thông báo.
- Từ chối: lịch **giữ nguyên Đã xác nhận**, yêu cầu thành **Không chấp thuận**, khách nhận lý do.
- Không tự hoàn tiền khi hủy lịch đã thanh toán. Cần xử lý bên ngoài luồng demo nếu có giao dịch thật.

## 5. Kiểm thử trên máy
1. Sao lưu PostgreSQL TEST trước khi chạy các quy trình.
2. Sao chép `server/.env` từ bản chạy được sang V6.71, không chia sẻ khóa bí mật.
3. Terminal Backend từ thư mục ngoài cùng: `cd .\PETDAY_OFFICIAL\server` rồi `npm install`, `npm run dev`.
4. Terminal Frontend mới từ thư mục ngoài cùng: `cd .\PETDAY_OFFICIAL` rồi `npm install`, `npm run dev`.
5. Nếu cổng 8443 bị chiếm, xác minh tiến trình Vite cũ rồi dừng trước khi chạy.
6. Test phân công N=0, N>0; Taxi trước/sau duyệt; no-show trước/sau giờ; khách hủy chờ duyệt; Admin duyệt và từ chối.

## Lưu ý
Không có migration SQL mới. Backend test và kiểm tra cú pháp TSX chạy thành công trong môi trường đóng gói; chưa kiểm thử cùng database PostgreSQL của người dùng. Nếu UI hiện HTTP 503 /bookings, cần khắc phục sai lệch schema/migration đang có trước khi nghiệm thu các luồng này.

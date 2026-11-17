# PetDay V6.107 – chính sách đổi lịch & Taxi (bản cập nhật trên V6.106.2)

## Đã cập nhật mã nguồn
- Đổi lịch trực tuyến: còn >3 giờ chọn khung trống trong 7 ngày tính từ ngày gửi; còn >1 đến 3 giờ chọn ngày hẹn hoặc ngày kế tiếp.
- Còn <=1 giờ / đến trễ: gửi yêu cầu chờ nhân viên hỗ trợ, giữ nguyên lịch cũ. Không đảm bảo yêu cầu được duyệt.
- Backend kiểm tra chính sách (không dựa duy nhất vào frontend); giữ kiểm tra trùng lịch/công suất và khóa giao dịch.
- Pet Taxi: khách được tự hủy chiều đón/chiều về trước khi xe khởi hành, miễn/hoàn 100% phí của chiều chưa dùng; sau xuất phát chưa đón thú cưng tiếp tục yêu cầu xác minh để được xét 50%; no-show đã xác minh 0%; lỗi PetDay 100%.
- Phân biệt số tiền được hoàn và việc chuyển tiền: **chưa có hoàn tiền ngân hàng tự động**.
- Điều chỉnh nhãn/hướng dẫn ở màn hình quản lý lịch khách hàng.

## Giới hạn quan trọng / cần triển khai tiếp
- Ngày giờ của Daycare có cả giờ đón và giờ trả; API đổi lịch hiện tại chưa nhận được thông tin giờ trả mới, nên Daycare tiếp tục yêu cầu nhân viên hỗ trợ (không thể tự đổi chỉ mỗi giờ bắt đầu).
- Taxi đang trên đường / đã bắt đầu chuyến không thể tự đổi lịch chăm sóc; trường hợp này cần phối hợp nhân viên và không được tự thay đổi chuyến.
- PetDay hiện chưa tích hợp xác minh chuyến xe/tài xế còn trống theo thời gian thực; không thể tự động xác nhận Taxi thực sự có xe chỉ dựa trên yêu cầu.
- Các quy tắc hủy/hoàn **dịch vụ chăm sóc** chưa được người dùng chốt trong bảng chính sách mới; để nguyên luồng hiện có, cần xác nhận trước khi thay thế.
- Không sửa schema PostgreSQL, không chạy migration tự động, không tự can thiệp DB hiện có.
- Chưa chạy được build frontend trong môi trường này do chưa có node_modules/npm cache. Cần chạy `npm install`, `npm run build`, `cd server && npm install && npm test` trên máy người dùng trước khi thay thế bản vận hành.

## Cách chạy
1. Giải nén sang thư mục mới; giữ V6.106.2 làm bản sao dự phòng.
2. Mở PowerShell trong thư mục `PETDAY_OFFICIAL`, chạy `npm install; npm run build; npm run dev`.
3. Trong PowerShell khác, `cd server; npm install; $env:PORT=4001; npm start` (cần `.env` hợp lệ giống dự án đang dùng).
4. Test các mốc 3 giờ, 1 giờ; Taxi trước xuất phát và sau xuất phát; kiểm tra lịch gốc, tiền hoàn và trạng thái Taxi.
5. Không chạy `npm audit fix --force` để tránh thay đổi phiên bản phụ thuộc ngoài ý muốn.

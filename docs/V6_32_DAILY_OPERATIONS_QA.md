# PetDay V6.32 – Lịch điều hành & tinh gọn quản trị

## Thay đổi mã nguồn

- `src/DailyOperations.tsx`: trang Tổng quan hiển thị danh sách lịch ngày được chọn, bộ lọc chi nhánh, nhân viên được giao, cờ cảnh báo chờ duyệt/chưa phân công/chưa thu tiền, và lối tắt đến chi tiết lịch và sổ thu tiền.
- `src/dailyAgendaRules.mjs`: quy tắc lọc và sắp xếp lịch, không can thiệp trạng thái dữ liệu.
- `src/Portal.tsx`: mở lịch từ bảng tổng quan sẽ chuyển sang tab Lịch & điều phối, tìm theo mã lịch; nút Sổ thu tiền mở tab Tài chính. Các lối tắt trước đây trỏ vào phần đang bị ẩn được sửa để chọn tab trước.
- Chỉ mount StaffPlanner khi đang ở tab Nhân viên, giảm nội dung không cần thiết được tạo ở các tab khác. Một số phần Admin khác cũng chỉ mount trong đúng phân hệ.
- `src/index.css`: thẻ và dòng lịch responsive, trạng thái focus rõ, hỗ trợ giảm chuyển động.
- `server/test/dailyAgenda.test.js`: 7 unit tests cho quy tắc lịch ngày.

## Kiểm thử thực tế trên máy cài đặt

1. Sao lưu database `petday`. Bản này không có migration mới; cần cấu trúc đến SQL 020.
2. Sao chép `.env` đang hoạt động sang `server/.env`, dừng cả hai terminal V6.31 để không chiếm cổng 4000/8443.
3. Chạy backend bằng `npm install && npm run dev` trong `server`, frontend tương tự trong thư mục gốc.
4. Đăng nhập Admin. Ở Tổng quan, chọn ngày và chi nhánh có lịch. Kiểm tra thứ tự khung giờ và nhãn trạng thái.
5. Bấm **Mở lịch** tại một lịch: tab Lịch & điều phối phải mở, từ khóa phải là mã lịch vừa bấm; không ghi sửa lịch.
6. Bấm **Mở sổ thu tiền**: tab Tài chính mở phần Sổ thu tiền; không tự đánh dấu đã thu tiền.
7. Trở lại Tổng quan, bấm các lối tắt Nhân viên, Nhắc lịch, Lịch hẹn, Tư vấn, Thiết lập ngân hàng, Ưu đãi. Mỗi nút phải mở đúng phân hệ chứ không cuộn vào phần ẩn.
8. Kiểm tra Customer không thấy trang quản trị; Staff chỉ được xem nơi làm việc của chính họ.
9. Thử chuyển tab qua lại và kiểm tra API console/network, chức năng thanh toán, hoàn tiền, hủy lịch và thông báo không bị thay đổi.
10. Kiểm tra giao diện ở 375px, 768px và 1280px: lịch ngày không tràn ngang, nút có thể chạm và menu Admin có thể cuộn ngang.

## Phân biệt mức độ kiểm chứng

- Đã chạy unit tests độc lập và kiểm tra cú pháp (transpile) TypeScript/TSX.
- Chưa chạy frontend production build đầy đủ vì dependency npm không có sẵn trong cache của môi trường kiểm tra.
- Chưa chạy kiểm thử tích hợp database PostgreSQL thật / đa trình duyệt.
- Không có thanh toán ngân hàng tự động, không tự hoàn tiền, không tạo hay thay đổi trạng thái lịch chỉ do thao tác lọc.

## Hạng mục tiếp theo

Kiểm thử vai trò Customer / Staff / Admin trên database thử nghiệm; kiểm tra các tác vụ đồng thời (đặt lịch trùng, đổi lịch và phân công); kiểm tra thanh toán/hoàn tiền; rà accessibility và bảo mật API.

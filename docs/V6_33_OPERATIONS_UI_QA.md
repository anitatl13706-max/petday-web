# PetDay V6.33 — Tinh gọn vận hành & kiểm thử

## Những thay đổi được triển khai
- Trang Tổng quan Admin có hàng đợi **Cần xử lý trước**, ưu tiên: lịch quá hạn, lịch chờ xác nhận, lịch đã xác nhận/chăm sóc nhưng chưa có người phụ trách, lịch đã hoàn tất chưa thu tiền. Mỗi lịch chỉ có một thẻ ưu tiên; chọn thẻ mở phiếu lịch hoặc phân hệ Tài chính.
- Yêu cầu hủy và đổi lịch được render **chỉ trong tab Lịch hẹn** của khách hoặc **tab Lịch & điều phối** của Admin; không còn dồn vào các tab Tài chính/Hỗ trợ.
- Sổ thu tiền giữ các lịch **đã thu tiền nhưng sau đó bị hủy** trong mục Đã thu để phục vụ đối soát/hoàn tiền; lịch đã hủy và chưa thu không được đưa vào danh sách cần thu.
- Các chỉnh sửa giao diện dùng navy / coral, thẻ có độ tương phản tốt, nút thao tác khả dụng trên mobile và trạng thái focus cho keyboard.
- Không thêm bảng hoặc migration; dữ liệu giữ nguyên. Cần database đã nâng cấp đến SQL 020 theo các phiên bản trước.

## Bộ kiểm tra cốt lõi trước khi nộp
1. Backend `/api/health` và `/api/health/schema`: xác nhận đang kết nối đúng database `petday`; nếu schema thiếu thì dừng và sao lưu trước khi sửa.
2. Đăng nhập **Customer**: mở Lịch hẹn, chuyển qua Thanh toán/Hoàn tiền/Đánh giá. Biểu mẫu Yêu cầu hủy / Đổi lịch chỉ được xuất hiện ở tab Lịch hẹn.
3. Đăng nhập **Admin**: mở Tổng quan, xác định lịch thật trong bảng Cần xử lý trước. Bấm Xử lý một lịch -> mở tab Lịch & điều phối và lọc chính xác theo mã lịch.
4. Kiểm tra lịch **quá hạn**: chỉ cảnh báo, không tự chuyển trạng thái hoặc tính phí.
5. Kiểm tra lịch **chờ xác nhận**, **chưa phân công**, **hoàn tất chưa thanh toán**: thẻ chỉ được hiển thị khi dữ liệu đáp ứng điều kiện.
6. Admin > Tài chính: lịch đã hủy và **đã thu** vẫn nằm trong lịch sử Đã thu. Lịch đã hủy **chưa thu** không được đưa vào Tổng phải kiểm tra.
7. Đặt lịch mới: kiểm tra cả tiền mặt và chuyển khoản; chuyển khoản chỉ được xác nhận có hiệu lực sau khi Admin đã cấu hình tài khoản nhận tiền.
8. Kiểm thử Customer -> Admin -> Staff -> Customer: tạo lịch, xác nhận, phân công, check-in, cập nhật chăm sóc, bàn giao, xác nhận thu tiền thủ công, đánh giá.
9. Kiểm thử iPhone/Android giả lập ở DevTools 375px và desktop 1366px: không tràn ngang, nút dễ bấm, nhãn dễ đọc.
10. Đối soát giao dịch chuyển khoản và hoàn tiền bằng sao kê thực nhận; KHÔNG đánh dấu đã trả/đã hoàn chỉ dựa vào lựa chọn phương thức.

## Kết quả kiểm tra tại môi trường xây dựng
- 102/102 bài unit test Node.js qua `node --test server/test/*.test.js`.
- `node --check server/src/server.js` không báo lỗi cú pháp.
- TypeScript parser: 17 file .ts/.tsx, 0 lỗi cú pháp.
- **Chưa chạy được `npm run build` frontend**: registry.npmjs.org không phân giải tên miền trong môi trường kiểm tra (`EAI_AGAIN`).
- **Chưa chạy integration với PostgreSQL trên máy người dùng**. Unit tests không chứng minh toàn bộ website hoạt động end-to-end.

## Nâng cấp không mất dữ liệu
1. Giữ nguyên database `petday`; không chạy lại SQL khởi tạo.
2. Sao chép `server/.env` từ bản V6.32 đã chạy được sang bản mới; **không đưa .env lên Git**.
3. Dừng các Terminal cũ sử dụng cổng 4000 và 8443, rồi chạy `npm install`, `npm run dev` tại `server/` và thư mục gốc ở hai Terminal.
4. Mở `http://localhost:4000/api/health/schema`, sau đó `http://localhost:8443/` và kiểm thử theo checklist.

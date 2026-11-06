# PetDay V6.34 — Bàn giao ca và tinh gọn Tổng quan

## Thay đổi
- Bỏ khối “Việc cần xử lý” trùng lặp và 8 nút “Điều hành PetDay” dài trên Tổng quan; giữ bảng ưu tiên và lịch ngày.
- Bổ sung phiếu bàn giao ca (client-side derived from API bookings) với bộ đếm việc còn vướng, mở lịch/sổ thu và xuất CSV an toàn.
- Công cụ Nhắc lịch và Hàng đợi nâng cao thu gọn trong hai khối mở rộng; không tự kích hoạt API hay thay đổi dữ liệu khi chỉ mở.
- Không có migration mới. SQL 001–020 vẫn là tiền đề.

## Nguyên tắc nghiệp vụ
- Lịch đã hủy chưa thu tiền không bị tính thành công nợ.
- Lịch đã thu tiền rồi hủy hoặc no-show được gắn nhãn *cần kiểm tra hoàn tiền*, tuyệt đối không tự hoàn.
- Lịch hoàn tất nhưng chưa thu tiền vẫn vào danh sách cần đối soát; không coi hoàn tất dịch vụ = đã thu tiền.
- Lịch quá hạn chưa xử lý cần xác minh thực tế.
- Dữ liệu phiếu bàn giao lấy từ danh sách /api/bookings hiện có, không phải biên bản ký nhận.

## Kiểm thử chấp nhận
1. Admin: Tổng quan chỉ có bảng ưu tiên, lịch ngày, bàn giao ca và hai công cụ thu gọn; không có các nhóm thẻ trùng lặp.
2. Chọn “Mở xử lý” trên phiếu bàn giao dẫn đúng lịch hoặc sổ thu; không thay đổi dữ liệu.
3. Thử booking hoàn tất chưa trả: xuất hiện trong phiếu bàn giao; thanh toán vẫn là chưa thu.
4. Booking hủy chưa trả: không có trong mục khoản cần thu. Booking hủy đã trả: được đưa vào đối soát chứ không tự hoàn.
5. CSV mở được trong Excel, và dữ liệu bắt đầu với =, +, @, - không bị thực thi như công thức.
6. Customer/Staff không nhìn thấy phiếu bàn giao Admin.
7. Chạy `cd server && npm test`; kiểm tra `npm run build` ở root trên máy có node_modules.

## Giới hạn
Chưa có e2e PostgreSQL, chưa kiểm thử production build trong môi trường thiếu npm registry. Việc đối soát tiền vẫn thủ công; không có chuyển khoản ngân hàng tự động.

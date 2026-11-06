# PetDay V6.21 — Giao diện gọn, hàng đợi và xử lý lịch quá hạn

## Phạm vi đã sửa

- Trang quản trị giữ 5 tab: Tổng quan, Lịch & điều phối, Nhân viên, Tài chính, Hỗ trợ & ưu đãi. Không bổ sung menu chính.
- Trong Tổng quan, thêm **Việc cần xử lý**: chờ duyệt, đang phục vụ, chưa thu tiền. Click chuyển đến danh sách đã lọc.
- Cảnh báo các lịch đã qua ngày hẹn nhưng vẫn **Đang chờ xác nhận** hoặc **Đã xác nhận**. Click cảnh báo sẽ chuyển đến bộ lọc **Lịch quá hạn chưa xử lý**.
- Danh sách lịch Admin/Customer: lọc theo trạng thái, tìm theo mã lịch/thú cưng/khách hàng/dịch vụ/chi nhánh/nhân viên, sắp xếp theo ngày hẹn. Bộ lọc hoàn toàn ở frontend, không sửa nội dung booking.
- Số liệu đếm được suy ra từ các booking tải qua `/api/bookings`, không phải số ảo.
- CSS cải thiện khoảng cách, thẻ KPI, khả năng đọc, thao tác mobile, focus và reduced-motion.

## Quy tắc nghiệp vụ

- **Lịch quá hạn**: ngày lịch nhỏ hơn ngày hôm nay theo ngày địa phương VÀ trạng thái là `Đang chờ xác nhận` hoặc `Đã xác nhận`.
- Cảnh báo không đồng nghĩa người dùng đã vắng mặt; Admin cần kiểm tra và thao tác no-show/hủy/đổi lịch qua luồng hiện có.
- **Chưa thu tiền**: booking chưa `Đã thanh toán` và chưa `Đã hủy`; đây là tín hiệu đối soát, không tự động trừ tiền.
- Phân quyền dữ liệu vẫn do backend thực hiện; Admin xem danh sách theo API Admin, Customer chỉ thấy lịch của chính họ. Bộ lọc frontend không được xem là biện pháp bảo mật.

## Checklist cần tự kiểm thử trên localhost

1. Customer đăng nhập, mở Lịch hẹn, tìm một mã lịch, thử lọc và bỏ lọc.
2. Admin đăng nhập, vào Tổng quan: số nhóm Việc cần xử lý phải phù hợp với danh sách PostgreSQL hiện tại.
3. Click `Chờ xác nhận` trong Tổng quan → chuyển sang tab Lịch & điều phối và chỉ hiện các lịch phù hợp.
4. Nhập từ khóa không tồn tại: hiện trạng thái rỗng và nút Xóa bộ lọc.
5. Chọn `Chưa thanh toán`: lịch Đã hủy phải không nằm trong bộ lọc.
6. Chọn `Lịch quá hạn chưa xử lý`: chỉ hiện lịch có ngày quá khứ ở 2 trạng thái đã nêu.
7. Đăng nhập Staff: xác nhận chỉ nhìn thấy lịch được phân công (luồng V6.20 không thay đổi).
8. Ở màn hình 375 px và 768 px: thanh tab cuộn ngang, nút dễ nhấn, không xuất hiện tràn ngang ngoài ý muốn.
9. Kiểm tra đặt lịch bằng tiền mặt/chuyển khoản, nhật ký chăm sóc, hoàn tiền như cũ: V6.21 không đổi API hay DB.

## Cài đặt

- Dự án kế thừa đầy đủ migration đến `017_v620_staff_accounts.sql`.
- **V6.21 không có migration mới** và không cần thao tác SQL trong pgAdmin.
- Sao chép `server/.env` đang hoạt động từ V6.20 sang server của bản này.
- Mở 2 terminal ở `PETDAY_OFFICIAL/server` và `PETDAY_OFFICIAL`; chạy `npm install`, `npm run dev` trong mỗi terminal.
- Không chạy 2 backend cùng lúc trên cổng 4000.

## Giới hạn kiểm thử trong môi trường dựng file

- `node --check server/src/server.js`: đạt.
- `npm test` trong server: 41/41 bài test hiện có đạt.
- TypeScript parser: không phát hiện lỗi cú pháp trong các file `.ts/.tsx` ở `src`.
- `npm run build` **chưa thực hiện thành công** vì môi trường thiếu dependency và npm registry gặp lỗi DNS `EAI_AGAIN`.
- Chưa có end-to-end hoặc kiểm thử PostgreSQL trên máy người dùng. Kiểm thử các tính năng mới bằng tay theo checklist trên.

## Đối chiếu UX bên ngoài

MoeGo Help Center mô tả việc tách Staff Calendar/Agenda, booking availability, xử lý hủy/no-show và quản lý thanh toán. PetDay vận dụng nguyên tắc bố cục: việc thường làm lên trước, dữ liệu booking ở trung tâm, xử lý tài chính tách khỏi hoàn tất chăm sóc. Không sao chép giao diện/thương hiệu từ MoeGo.

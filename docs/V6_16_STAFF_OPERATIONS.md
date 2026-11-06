# PetDay V6.16 — Nhân viên, ca làm, phân công và bàn giao

## 1. Mục tiêu

Không tăng mục điều hướng của khách. Nhóm tác vụ **Nhân viên & phân công** chỉ xuất hiện trong Admin, cùng với hàng đợi và nhật ký chăm sóc. Các phân hệ khác (Booking, Discount, Payment, Consultation, Notification) tiếp tục dùng chung PostgreSQL.

Tham khảo nguyên tắc giao diện lịch vận hành của MoeGo và lifecycle đặt lịch/tiếp nhận/checkout của Gingr, chỉ tham khảo ý tưởng thông tin và phân tách vai trò, không sao chép giao diện hoặc tuyên bố có đủ tính năng của họ:
- https://help.moego.pet/en/articles/14008213-grooming-calendar-view-desktop-overview
- https://docs.gingr.io/documentation

## 2. Quy trình triển khai

1. Sao lưu database `petday` (Backup trong pgAdmin). Giữ lại file backup trước khi thử SQL.
2. Cần hoàn tất cấu trúc SQL đến `012_v615_capacity_management.sql`, không chạy lại các migration cũ nếu đã có.
3. Chạy `database/013_v616_staff_dispatch.sql` một lần trong Query Tool trên đúng database `petday`. File chỉ thêm bảng và chỉ mục, không xóa/sửa dữ liệu cũ. Nếu bảng trùng tên với cấu trúc không tương thích, dừng để đối chiếu thủ công.
4. Sao chép riêng `server/.env` đang hoạt động từ V6.15; không chia sẻ file chứa mật khẩu, không đưa `.env` vào git.
5. Dừng hai Terminal V6.15 (tránh EADDRINUSE), chạy `npm install` và `npm run dev` lần lượt ở `server` và thư mục gốc `PETDAY_OFFICIAL`.
6. Mở `http://localhost:4000/api/health/schema` và đảm bảo `schemaReady:true` và `missing:[]`; mở frontend ở URL Vite in ra.

## 3. Luồng quản trị V6.16

1. Admin mở **Nhân viên & phân công** → thêm hồ sơ nhân viên với đúng chi nhánh.
2. Admin tạo ca theo ngày và giờ trong 5 khung giờ của hệ thống.
3. Khách đặt lịch, Admin xác nhận từ hàng đợi / danh sách lịch.
4. Admin phân công cho lịch `Đã xác nhận`; backend kiểm tra nhân viên đang hoạt động, chi nhánh trùng, có ca trực, chưa nhận lịch khác cùng giờ. Mỗi lịch chỉ có một người phụ trách.
5. Khách có thể xem nhân viên được phân công và nhận thông báo tài khoản.
6. Khi cơ sở đã có nhân viên đang hoạt động, lịch bắt buộc được phân công trước khi **check-in**. Nếu cơ sở chưa thiết lập nhân sự, luồng cũ vẫn dùng được.
7. Check-in → ít nhất 1 cập nhật chăm sóc → Sẵn sàng bàn giao → Check-out. Không cho đổi trạng thái `Đang thực hiện` và `Hoàn tất` trực tiếp qua API trạng thái, để tránh bỏ qua mốc vận hành.
8. Khách đổi lịch được duyệt hoặc khách/Admin hủy trước khi thực hiện: phân công cũ được giải phóng trong transaction; log `staff_assignment_events` vẫn còn, cần phân công lại theo giờ mới.
9. Không thể ngừng nhân viên khi còn các lịch `Đã xác nhận`/`Đang thực hiện` đang giao cho người đó; không thể xóa ca khi đã giao lịch.

**Giới hạn hiện tại:** Một ca tại thời điểm đặt lịch được mô hình hóa theo một slot, không phải lịch lao động có thời lượng giao nhau. Một nhân viên không thể trùng slot, nhưng chưa có thuật toán chồng lấn thời lượng nhiều giờ. Hồ sơ nhân viên chưa phải tài khoản `staff` đăng nhập riêng; tất cả thao tác vận hành thực hiện bởi Admin có lưu người thực hiện. Không tự ý dùng tính năng cho quản lý nhân sự lao động thật khi chưa bổ sung phân quyền, ca kéo dài và chấm công.

## 4. Kiểm thử nghiệp vụ (cần chạy trên máy có PostgreSQL)

| ID | Tình huống | Kết quả kỳ vọng |
|---|---|---|
| ST-01 | Admin tạo nhân viên và ca hợp lệ | Lưu trong PostgreSQL; danh sách hiển thị khi tải lại |
| ST-02 | Customer gọi API `/api/admin/staff` | HTTP 403 |
| ST-03 | Phân công khi booking chưa xác nhận | HTTP 409 |
| ST-04 | Phân công nhân viên khác chi nhánh | HTTP 422 |
| ST-05 | Phân công nhân viên không có ca | HTTP 409 |
| ST-06 | Hai lịch trùng ngày, giờ cho một người | Lịch thứ hai HTTP 409; không tạo hai phân công |
| ST-07 | Check-in khi cơ sở có nhân viên nhưng lịch chưa phân công | HTTP 409 |
| ST-08 | Check-in → ready không ghi chăm sóc | HTTP 409 |
| ST-09 | Check-in → care_update → ready → check_out | 4 mốc lưu đúng thứ tự; lịch chuyển sang Hoàn tất |
| ST-10 | Duyệt đổi ngày/giờ cho lịch đã giao | Giải phóng phân công, lưu log; khách thấy trạng thái mới |
| ST-11 | Ngừng nhân viên còn lịch đang phục vụ | HTTP 409 |
| ST-12 | Xóa ca trực đã giao lịch | HTTP 409 |
| ST-13 | Khách xem lịch có phân công | Thấy tên người phụ trách, không thấy hồ sơ nhân sự riêng |
| ST-14 | Admin đối soát chuyển khoản/tiền mặt | Giữ logic riêng với việc check-out chăm sóc |

## 5. Trạng thái kiểm chứng khi đóng gói

- Node.js `--check` cho backend: đạt.
- TypeScript source TS/TSX: phân tích cú pháp bằng TypeScript compiler API: đạt.
- Node.js unit tests gồm quy tắc giá, dịch vụ và phân công/bàn giao: 18/18 đạt.
- Không có kết nối đến database PostgreSQL của người dùng; **chưa chạy migration 013, chưa test concurrency hoặc end-to-end**.
- `npm install` frontend bị chặn/timed out ở môi trường đóng gói; **chưa có xác nhận `npm run build`**. Cần chạy build trên máy người dùng trước khi nghiệm thu.

## 6. Phát triển tiếp (chưa triển khai trong V6.16)

- Phân quyền tài khoản nhân viên riêng, lịch ca kéo dài và các xung đột thời lượng thực tế.
- Pet Taxi có báo giá theo vùng và xác minh địa chỉ.
- Ảnh báo cáo chăm sóc có quyền truy cập và kiểm soát nội dung.
- VietQR / VNPAY sandbox có xác nhận giao dịch từ backend; hiện chuyển khoản đối soát thủ công.
- Nhắc lịch tự động với hàng đợi giao việc, retry và log gửi.
- UAT đa thiết bị, accessibility, security audit và performance test.

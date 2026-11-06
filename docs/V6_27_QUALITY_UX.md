# PetDay V6.27 — Tinh gọn giao diện và xuất lịch vận hành

## Mục đích
- Sửa lỗi hiển thị `StaffPlanner` ở tất cả tab Admin. Bộ phân công chỉ hiện trong **Nhân viên**.
- Hộp duyệt đổi lịch của khách chỉ hiển thị trong tab **Lịch hẹn**, không làm dài các tab Tài chính/Đánh giá.
- Admin xuất **danh sách lịch đang lọc** ra file CSV (Excel đọc được). Không xuất email, số điện thoại, token, mật khẩu hoặc ghi chú y tế; không tự suy diễn doanh thu.
- Sử dụng chính dữ liệu đã tải từ API. Không thêm migration, không thay đổi PostgreSQL.

## Quy trình kiểm thử
1. Admin mở 5 tab: chỉ tab Nhân viên có bảng phân công/ca trực.
2. Admin vào Lịch, lọc **Chờ xác nhận**, bấm **Xuất CSV**. File chứa đúng số dòng lịch được lọc và bộ cột được chỉ định. Không có email/SĐT.
3. Thử tên thú cưng `=HYPERLINK(...)`, `+1+1` hoặc chứa dấu phẩy/ngoặc kép: dữ liệu được escape, không bị Excel hiểu là công thức.
4. Customer vào Lịch hẹn: duyệt đổi lịch ở tab Lịch hẹn, không hiện ở Thanh toán/Hoàn tiền/Đánh giá.
5. Kiểm tra không có xuất CSV ở Customer và Staff.
6. Test trên mobile 375px: các tab cuộn ngang, nút trong thẻ lịch không tràn ngang.
7. Kiểm tra `npm run build` và hai vai trò với PostgreSQL thật trước khi nộp.

## Giới hạn
- CSV chỉ là bản chụp dữ liệu đang lọc ở frontend, không phải báo cáo doanh thu đã kiểm toán.
- Không có tính năng thanh toán trực tuyến hoặc đối soát tự động mới.
- Chưa tích hợp thêm email/SMS. Không thêm các tính năng thiếu xác minh.

## Cài đặt
- Không cần SQL 020. Database phải có migration 001–019 đầy đủ.
- Copy `server/.env` từ bản đang hoạt động. Dừng bản cũ, chạy `npm install` / `npm run dev` trong thư mục root và `server`.

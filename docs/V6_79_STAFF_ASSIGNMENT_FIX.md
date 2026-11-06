# PetDay V6_79 — Sửa tương tác phân công nhân viên

- Nguồn: V6_78.
- Nhân viên hiện phụ trách không còn là lựa chọn thay thế hợp lệ, kể cả khi dữ liệu UI thiếu `assignedStaffId`; so khớp thêm tên nhân viên.
- Nút Lưu phân công chỉ bật khi có lựa chọn khác người hiện tại và lịch đang `Đã xác nhận`.
- Lịch `Đang thực hiện` hiển thị giải thích không thể đổi nhân viên.
- Khi server từ chối phân công (ví dụ trùng giờ/khác chi nhánh), thông báo trả về xuất hiện ngay trong dòng lịch.

## Kiểm thử thủ công trên PostgreSQL TEST
1. Chọn đúng nhân viên đang phụ trách: nút Lưu bị khóa.
2. Chọn người khác ở lịch Đã xác nhận, cùng chi nhánh, không trùng lịch: lưu và tải lại, người phụ trách phải đổi.
3. Chọn người trùng giờ: server trả 409, tên phụ trách cũ giữ nguyên, thông báo ở đúng dòng.
4. Chọn lịch Đang thực hiện: không cho đổi người.
5. Chuyển phiên bản phải đảm bảo Backend/Frontend cùng V6_79, không có bản PetDay cũ chiếm cổng.

Đã chạy 155 backend tests và kiểm tra cú pháp TSX của `StaffPlanner.tsx`. Chưa thực hiện kiểm thử E2E trên PostgreSQL người dùng.

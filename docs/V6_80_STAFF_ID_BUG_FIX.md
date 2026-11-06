# PetDay V6_80 — Sửa lỗi nút Lưu phân công bị khóa

## Nguyên nhân
Cột `staff_members.id` sử dụng PostgreSQL `BIGINT`. Thư viện `pg` trả BIGINT dưới dạng chuỗi (ví dụ `"12"`). Trong V6_79, giao diện tìm nhân viên bằng so sánh nghiêm ngặt `p.id === Number(selection[code])`, khiến đối tượng chọn không tìm được dù tên đã xuất hiện trong ô chọn. Do đó nút bị vô hiệu và hiện sai thông báo «Vui lòng chọn nhân viên thay thế».

## Thay đổi
- So sánh mã nhân viên đã chuẩn hóa về chuỗi ở tất cả chỗ tìm nhân viên đã chọn.
- So sánh mã người phụ trách hiện tại theo cùng kiểu để khóa chọn lại cùng người.
- Khi gửi PATCH, chuyển mã nhân viên về số như Backend yêu cầu.
- Giữ quy tắc không đổi nhân viên sau khi dịch vụ bắt đầu; Backend vẫn kiểm tra trùng giờ và đúng chi nhánh.

## Test thủ công
1. Chọn Bảo Yến thay Thanh Lam ở lịch Đã xác nhận, đúng chi nhánh, không trùng giờ: nút Lưu bật, PATCH thành công và tải lại thấy Bảo Yến.
2. Chọn người hiện đang phụ trách: tùy chọn bị vô hiệu, không phát sinh PATCH.
3. Thử chọn nhân viên trùng giờ: Backend trả 409, tên cũ không thay đổi và thông báo ngay dưới lịch.
4. Lịch đang thực hiện: không được phép điều phối lại.
5. Dùng DevTools Network xác nhận PATCH gửi `staffId` số, không gửi chuỗi rỗng.

Backend tests tự động và kiểm tra cú pháp TSX không thay thế việc kiểm thử PostgreSQL thật. Không cần migration SQL mới.

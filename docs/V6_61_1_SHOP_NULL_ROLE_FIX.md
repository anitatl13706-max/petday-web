# PetDay V6.61.1 — Sửa lỗi vào Cửa hàng khi user=null

Lỗi: Cannot read properties of null (reading 'role') sau khi mở /#cua-hang.

Nguyên nhân: ba phần Cửa hàng cho customer/admin/staff nằm ngoài nhánh render xác thực, vẫn dùng `user.role` khi chưa đăng nhập hoặc đang tải phiên.

Sửa: `user?.role` cho cả ba nhánh. Giữ nguyên kiểm tra phân quyền API backend và toàn bộ dữ liệu PostgreSQL.

Kiểm tra: `npm run check:syntax` và `npm run check:auth-guard`. Không cần chạy SQL để sửa lỗi này.

Nếu website vẫn yêu cầu đăng nhập, đó là luồng xác thực bình thường; lỗi crash không còn xảy ra.

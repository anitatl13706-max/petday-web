# PetDay V6.70 — Điều hướng Admin

- Bỏ lời giải thích kỹ thuật về việc tách tài khoản khỏi giao diện khách hàng.
- Thứ tự: Tổng quan → Lịch hẹn → Nhân viên → Đơn cửa hàng → Sản phẩm & kho → Khách hàng → Tài chính → CSKH & ưu đãi.
- Menu tự xuống dòng trên màn hình hẹp, không cần thanh cuộn ngang.

## Lỗi `/bookings` HTTP 503
Đây là lỗi từ backend/database: bảng `bookings` có thể còn CHECK constraint danh mục gói cũ, khác 8 gói mà frontend/backend mong đợi. Sao lưu database TEST trước khi đối chiếu `database/022_v638_service_packages.sql`. Không chạy lại các migration 001–021 hay tự bỏ constraint mà chưa kiểm tra giá trị cũ và thông báo lỗi gốc.

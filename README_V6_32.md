# PetDay V6.32 – Daily Operations & Admin Focus

Kế thừa V6.31; thêm lịch làm việc trong ngày và sửa điều hướng giữa các tab quản trị. Không yêu cầu SQL mới nếu database đã đủ migration 001–020.

Xem `docs/V6_32_DAILY_OPERATIONS_QA.md` để kiểm thử.

Chạy frontend: tại thư mục `PETDAY_OFFICIAL`, `npm install` và `npm run dev`.
Chạy backend: tại thư mục `PETDAY_OFFICIAL/server`, sao chép file `.env` của bản cũ, `npm install` và `npm run dev`.

Không chép file `.env` chứa mật khẩu vào file ZIP gửi công khai. Dừng các terminal backend/frontend cũ để tránh EADDRINUSE.

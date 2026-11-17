# PetDay V6.136 – Daycare luôn có lịch nhận đặt

- Khi chọn Daycare, API `/api/availability` trả `available: true` cho mọi khoảng thời gian hợp lệ, không áp dụng giới hạn công suất chung của Spa/Grooming hay các lịch Daycare khác.
- API `/api/bookings` cũng bỏ kiểm tra giới hạn công suất với Daycare, để tránh báo có chỗ ở bước 3 nhưng từ chối ở bước xác nhận.
- Vẫn chặn giờ ngoài 08:00–20:00, thời lượng/ngày vượt chính sách Daycare, khoảng thời gian bị Admin khóa, thú cưng có lịch trùng, gói dịch vụ ngừng hoạt động và các điều kiện thanh toán khác.
- Spa/Grooming vẫn giữ giới hạn công suất như trước.
- Không cần migration SQL mới. Nếu dùng database chung với V6.135 cần đã chạy migration V6.135.

## Chạy

Terminal backend: cd PETDAY_OFFICIAL/server ; npm install ; npm start
Terminal frontend: cd PETDAY_OFFICIAL ; npm install ; npm run dev

Chú ý: `PORT` backend và proxy API của Vite phải đồng bộ (thông thường 4001). Không đưa file `.env` có mật khẩu vào ZIP chia sẻ.

## Test

1. Daycare cùng ngày 08:00–12:00 => có chỗ (nếu không khóa); thử ở cả hai chi nhánh.
2. Daycare khi Spa/Grooming đã chiếm hết công suất => vẫn có chỗ.
3. Daycare giờ về 21:00 hoặc vượt giới hạn ngày => từ chối hợp lệ.
4. Admin khóa giờ => lịch bị từ chối.
5. Cùng thú cưng có lịch trùng => từ chối khi đặt lịch.
6. Grooming/Spa đầy công suất => vẫn từ chối như cũ.

Đây là chính sách đặt lịch không giới hạn công suất **cho môi trường đồ án**; nếu vận hành thực tế cần giới hạn thú cưng/nhân lực để đảm bảo an toàn.

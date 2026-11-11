PETDAY V6.103.3 — Kiểm tra đổi lịch không thay đổi thời gian

Sửa từ mã nguồn V6.103.2:
- Frontend: không gửi yêu cầu nếu ngày và giờ mới giống ngày và giờ cũ; hiện lý do.
- Backend: chặn ngay tại POST /api/bookings/:code/reschedule kể cả API được gọi trực tiếp.
- Admin: chặn duyệt những yêu cầu đang chờ nhưng không làm thay đổi ngày/giờ hiện tại.
- Đổi ngày nhưng giữ nguyên giờ, hoặc đổi giờ trong cùng ngày vẫn hợp lệ nếu các điều kiện khác đạt.
- Không sửa schema PostgreSQL, không yêu cầu chạy migration.
- Giữ nguyên .env trên máy người dùng, đừng đưa thông tin bí mật vào ZIP.

Cách chạy: sao chép server/.env từ bản đang chạy, rồi npm install + npm start trong PETDAY_OFFICIAL/server; npm install + npm run dev trong PETDAY_OFFICIAL.
Tắt các terminal phiên bản cũ trước khi mở bản mới.

Kiểm thử:
1) Lịch 04/12 08:30 -> 04/12 08:30: không cho gửi, không sinh yêu cầu mới.
2) Lịch 04/12 08:30 -> 05/12 08:30: cho gửi nếu hợp lệ.
3) Lịch 04/12 08:30 -> 04/12 10:00: cho gửi nếu hợp lệ.
4) Admin duyệt yêu cầu cũ trùng lịch hiện tại: trả lỗi nghiệp vụ, không tiêu hao lượt đổi.
5) Lịch đã duyệt đổi có ngày/giờ mới hiển thị cho khách sau khi tải lại.

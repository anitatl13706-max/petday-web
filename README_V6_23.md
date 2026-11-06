# PetDay V6.23 – Compact UX & Operational Focus

Bản phát triển từ PetDay V6.22. Không thay đổi DB schema, không chạy SQL mới.

## Các điểm mới
- Tài khoản khách: 4 tab trong một trang Lịch hẹn (Lịch hẹn / Thanh toán / Hoàn tiền / Đánh giá). Loại bỏ cảm giác 4 mục hiển thị lặp và kéo dài.
- Tóm tắt lịch đang chờ xác nhận/đang thực hiện và thao tác đặt lịch mới.
- Bộ lọc theo lịch hôm nay, lịch sắp tới, chờ duyệt, đang phục vụ, hoàn tất, chưa thanh toán và quá hạn.
- Admin thấy số lượng lịch trong ngày; trạng thái lịch có màu sắc ngữ nghĩa và accessibility.
- Giữ nguyên nghiệp vụ thanh toán tiền mặt/chuyển khoản do Admin cấu hình và đối soát thủ công; không tạo thanh toán giả.

## Hướng dẫn chạy
1. Nếu đã có V6.22 và database đã nâng cấp đến `018_v622_pet_taxi.sql`, không chạy SQL bổ sung.
2. Sao chép `server/.env` đang chạy vào thư mục `PETDAY_OFFICIAL/server/` mới. Không đưa mật khẩu lên chat hoặc repo.
3. Dừng backend cũ trên port 4000, frontend cũ trên 8443.
4. Trong thư mục `PETDAY_OFFICIAL/server`: `npm install`, `npm run dev`.
5. Trong thư mục `PETDAY_OFFICIAL`: `npm install`, `npm run dev`.
6. Kiểm tra http://localhost:4000/api/health/schema và http://localhost:8443/.

## Chất lượng và giới hạn
- 47/47 unit tests backend thành công, `node --check` backend thành công.
- 10 file TS/TSX được phân tích cú pháp với TypeScript: 0 lỗi parse.
- Không thể chạy `vite build` do cache npm trong môi trường kiểm tra thiếu gói `@tailwindcss/vite`. Chưa thực hiện PostgreSQL end-to-end trên máy người dùng.
- V6.23 là bản tăng chất lượng giao diện/trải nghiệm và lọc vận hành, không phải cam kết production-ready.

Tham khảo tài liệu kiểm thử trong `docs/V6_23_UX_ACCEPTANCE.md`.

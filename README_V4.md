# PetDay v4 – Hỗ trợ hai kênh và hồ sơ thú cưng

## Có gì mới
- Hai nút luôn sẵn ở cuối màn hình: **Trợ lý PetDay** (trả lời theo kịch bản, KHÔNG phải AI tạo sinh) và **Nhân viên tư vấn** (gửi phiếu hỗ trợ lưu PostgreSQL, KHÔNG phải live chat).
- Admin mở khu vực Quản trị và nhấn **Tải yêu cầu tư vấn** để xem/đổi trạng thái các phiếu.
- Hồ sơ thú cưng hiển thị theo thẻ có ảnh (URL HTTPS hoặc biểu tượng thay thế), thêm và **chỉnh sửa** qua API.
- Backend tra cứu role hiện hành khi truy cập tài nguyên chỉ dành cho Admin.

## NÂNG CẤP VỚI DATABASE HIỆN CÓ
1. Sao lưu PostgreSQL petday trước khi nâng cấp.
2. **CHỈ CHẠY database/003_support_pets.sql** MỘT LẦN trong Query Tool của database petday; không chạy lại 001 hay 002.
3. Sao chép `server/.env` từ bản v3 sang `server/.env` của bản v4, không chia sẻ file này.
4. Dừng backend và frontend phiên bản cũ bằng Ctrl+C. Mở hai terminal trong đúng thư mục.
5. Backend: `cd server; npm install; npm run dev`
6. Frontend (gốc dự án): `npm install; npm run dev`
7. Kiểm tra `/api/health`, thử sửa thú cưng, gửi yêu cầu tư vấn và xem trong Admin.

## Hạn chế, việc tiếp theo
- Trợ lý hiện trả lời dựa trên tập câu hỏi/quy tắc, KHÔNG có kết nối LLM. Nếu muốn AI tạo sinh cần API server-side, kiểm soát chi phí, giới hạn nội dung, công cụ đọc dữ liệu, kiểm thử an toàn.
- Nhân viên xử lý **phiếu hỗ trợ**, không phải chat realtime; chưa có hệ thống gửi email tự động. Cần quy trình phản hồi ngoài hệ thống và cấu hình email thật trước khi dùng công khai.
- Ảnh thú cưng dùng URL HTTPS; upload file thật cần lưu trữ tệp, kiểm tra MIME/size, bảo vệ quyền riêng tư. Không dùng ảnh cá nhân thật khi thử.
- Quên mật khẩu/đổi lịch/Pet Taxi/add-on/chế độ thanh toán vẫn chưa được tích hợp đầy đủ; không tuyên bố là đã hoàn thành.
- Ở bản demo, các thông tin hotline/địa chỉ, đánh giá trên trang chủ cần thay bằng thông tin hợp lệ trước khi công khai.
- Bản code có kiểm tra cú pháp, cần chạy và test end-to-end trên máy có PostgreSQL.

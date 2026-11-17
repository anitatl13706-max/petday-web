# PetDay V6.106.1 — Trọn bộ frontend + backend (bản TEST)

## Điểm đã chỉnh thêm so với V6.106 FIX_API500
- Sửa API GET `/api/availability/day` sử dụng khoảng ngày hợp lệ (bản FIX_API500 là nguồn).
- Frontend Vite mặc định dùng `http://localhost:5173`, API proxy mặc định đến backend `http://localhost:4001`, không cần sửa `vite.config.ts` thủ công.
- Backend mặc định dùng cổng 4001 nếu không có biến môi trường `PORT`. Render vẫn ưu tiên `PORT` do Render cấp.
- Màn hình đặt lịch thể hiện đúng xác nhận **tự động có điều kiện**, không ghi sai là chờ nhân viên duyệt.
- Trang xác nhận Daycare hiển thị cả ngày đến/ngày về và giờ đến/giờ về.
- Rút gọn một số ghi chú cũ chưa phù hợp với tự động xác nhận.

## Chạy trên Windows
1. Giải nén ZIP và mở thư mục `PETDAY_OFFICIAL` trong VS Code.
2. Terminal 1 (frontend): `npm install`, `npm run dev`; mở chính xác URL Local, thông thường `http://localhost:5173`.
3. Terminal 2 (backend): `cd server`, `npm install`, `npm start`; backend dùng `http://localhost:4001` theo mặc định.
4. Kiểm tra `http://localhost:4001/api/health` và `http://localhost:4001/api/health/schema`.
5. Đăng nhập thử và vào Dịch vụ → Grooming → chọn ngày tương lai; phải thấy các slot khả dụng; sau đó kiểm tra Daycare.
6. Nếu backend đã có môi trường `PORT=4000` và chưa khởi động trên 4001, chạy `$env:PORT=4001; npm start` trong PowerShell.

## Nghiệp vụ được giữ
- Grooming/Spa: 8 slot 90 phút trong 08:00–20:00; những gói kéo dài hơn thời gian đóng cửa sẽ không được chọn slot quá muộn.
- Daycare: một gói hiển thị, thời gian đến/về có ngày và giờ, tối đa bảy ngày; tính 40.000đ/giờ hoạt động 08:00–20:00, **không phải lưu trú qua đêm**. Có thể chọn một gói Grooming hoặc Spa kèm theo.
- Khách lần đầu: bắt buộc cọc chuyển khoản 20% và chỉ xác nhận sau khi ghi nhận tiền thực nhận. Khách cũ chọn tiền mặt đủ điều kiện có thể xác nhận tự động.
- Đổi và hủy lịch tự động trong điều kiện nghiệp vụ cho phép; ngoại lệ Taxi hoặc dịch vụ đã bắt đầu phải xử lý riêng. Hoàn tiền có thể tự duyệt theo chính sách nhưng **không chuyển tiền thực tế tự động**.

## Quan trọng
- API ngân hàng/webhook **chưa có** nên không thể tự xác nhận tiền chỉ vì khách bấm “Đã chuyển khoản”. Không giả lập là đã hoàn tiền thật.
- Không ghi đè phiên bản Production. Dùng database TEST, không dùng DATABASE_URL production.
- Kiểm tra UI/luồng đầy đủ với dữ liệu thật của môi trường TEST trước khi triển khai.

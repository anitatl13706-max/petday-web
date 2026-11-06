# PetDay V6_48 – hướng dẫn triển khai TEST

## Đã làm
- Trang Shop riêng: hero, thanh tìm kiếm, lọc 3 danh mục, sắp xếp, phân trang 9 sản phẩm, thẻ minh họa bằng emoji (không phải ảnh chụp sản phẩm), giỏ hàng và nhận tại chi nhánh.
- Danh mục SQL 029 bổ sung 30 SKU mẫu, bên cạnh SQL 028 và 4 SKU gốc; không tự thay đổi dữ liệu database.
- Kiểm tra biến cấu hình bằng `npm run check:configuration` ở thư mục PETDAY_OFFICIAL; không in giá trị bí mật.

## Thiết lập quên mật khẩu
1. Sao chép `server/.env.example` thành `server/.env` nếu chưa có. Giữ DATABASE_URL và JWT_SECRET đã dùng ở bản chạy tốt. Không chia sẻ file .env.
2. Với Gmail: bật xác minh 2 bước và tạo App Password phù hợp tài khoản; điền SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER, SMTP_PASS (App Password), SMTP_FROM, RESET_BASE_URL=http://localhost:8443/?reset=1#tai-khoan.
3. Chạy lại backend. Xem `http://localhost:4000/api/health/features` và thử email nhận thật; cờ configured chỉ kiểm tra có trường, KHÔNG đảm bảo gửi thành công. Nếu môi trường chặn SMTP, cần dùng email provider khác.

## Thiết lập chuyển khoản
- Phía Admin: Tài chính → Thiết lập ngân hàng, nhập NGÂN HÀNG, SỐ TÀI KHOẢN và CHỦ TÀI KHOẢN thật (không tự bịa).
- Cần migration 010, 017, 019–025 theo trạng thái schema thực tế; kiểm tra GET `/api/health/schema`, `/api/health/workflows` trên TEST trước khi chạy SQL. Không chạy lại file nền một cách mù quáng.
- Đặt đơn mới; xác nhận phương thức chuyển khoản đã mở, tạo mã đơn; chỉ đánh dấu đã thanh toán khi Admin xác minh giao dịch thực nhận.

## Thêm sản phẩm
- Sao lưu database TEST; chạy theo thứ tự `database/024_v641_retail_booking.sql` (nếu chưa chạy), `database/028_v647_optional_retail_catalog_seed.sql`, rồi `database/029_v648_optional_extended_retail_catalog.sql`.
- KHÔNG chạy 024 lại chỉ để seed nếu đã có schema; chỉ chạy 028 và 029. Các bản seed tránh trùng theo tên. Giá/tồn kho đều là số giả định để kiểm thử.
- Admin có thể sửa sản phẩm và tồn kho. API giới hạn tối đa **3 loại sản phẩm/đơn**, tối đa **3 đơn vị/loại**; chưa có giao hàng tận nhà hay hoàn trả tự động.

## Chạy
Terminal 1 `cd PETDAY_OFFICIAL/server && npm install && npm run dev`.
Terminal 2 `cd PETDAY_OFFICIAL && npm install && npm run check:configuration && npm run dev`.
Mở http://localhost:8443 (theo vite.config.ts), có thể đổi nếu PORT khác.

## Chưa tự động hoàn thành được
- Tài khoản SMTP/App Password thật, tài khoản ngân hàng thật và PostgreSQL TEST không có trong ZIP.
- Chưa xác nhận email gửi đến hộp thư, chuyển khoản được ngân hàng ghi có, hoặc migration đã được chạy trên DB thực của bạn.
- Minh họa trong thẻ hàng bằng emoji, chưa phải ảnh SKU thật; để lên môi trường bán hàng cần ảnh có quyền sử dụng, đúng sản phẩm.

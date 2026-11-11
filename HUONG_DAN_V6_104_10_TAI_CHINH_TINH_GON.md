# PetDay V6.104.10 — Tài chính tinh gọn

## Thay đổi giao diện

- Quản trị → Tài chính có ba nhóm: **Cần xử lý**, **Đã xử lý**, **Thiết lập**.
- Trong Cần xử lý: chọn một trong **Dịch vụ**, **Cửa hàng**, **Hoàn tiền**. Chỉ nội dung được chọn hiển thị, không còn nhiều bảng dài xếp liên tiếp.
- **Dịch vụ:** Sổ thu tiền là nơi ghi nhận tiền thực thu; tra biên nhận và phí sau điều chỉnh trước khi xác nhận. Không còn hai chỗ xác nhận trùng cùng giao dịch dịch vụ.
- **Cửa hàng:** Giữ chức năng thu tiền đơn cửa hàng riêng.
- **Hoàn tiền:** Chuyển giữa Dịch vụ/Cửa hàng và Pet Taxi. Hồ sơ chờ duyệt/chờ hoàn không bị đưa nhầm sang lịch sử.
- **Đã xử lý:** tra các lịch đã thu, hồ sơ hoàn đã xử lý và nhật ký; đơn cửa hàng được tra cứu tại Đơn cửa hàng.
- **Thiết lập:** Cấu hình thông tin nhận chuyển khoản, giữ quy tắc an toàn cho chế độ mô phỏng.
- Sổ thu tiền bỏ ô lọc trạng thái bị khóa; giá trị lịch gốc được phân biệt với số còn phải thu sau điều chỉnh.

## Không đổi

- Không sửa PostgreSQL; không có migration mới. Cần giữ các migration trước đó đến `055`.
- Không đổi API thanh toán, hủy Taxi, đối soát, duyệt và xác nhận hoàn tiền.
- Chỉ ghi nhận thu tiền khi Admin thực sự xác nhận khoản đã thu (môi trường demo là ghi nhận mô phỏng).
- Chưa thu: giảm khoản phải thu ở hóa đơn. Đã thu dư: qua hồ sơ hoàn tiền. Hoàn tiền không tự chuyển khoản ngân hàng.
- Chính sách Taxi 100% / 50% / 0% tiếp tục giữ như bản trước.

## Chạy localhost

1. Sao lưu và giữ lại bản cũ; giải nén ZIP.
2. Chép `PETDAY_OFFICIAL/server/.env` từ phiên bản trước sang đúng vị trí bản mới.
3. Terminal 1: `cd PETDAY_OFFICIAL/server`, `npm install`, `npm start`.
4. Terminal 2: `cd PETDAY_OFFICIAL`, `npm install`, `npm run dev`.
5. Không chạy migration SQL mới. Không chuyển khoản thật trong tài khoản demo.

## Kiểm thử ngắn

1. Admin → Tài chính → Cần xử lý → Dịch vụ: thấy Sổ thu tiền, không có hai bảng cùng xác nhận tiền dịch vụ.
2. Chuyển Cửa hàng: thấy các đơn còn chờ thu. Chuyển Hoàn tiền: thấy nhóm hồ sơ dịch vụ/cửa hàng và Taxi.
3. Chuyển Đã xử lý → Đã thu/Đã hoàn: dữ liệu đã xử lý vẫn tra cứu được; lịch sử không vào hàng đợi mới.
4. Chuyển Thiết lập: chỉnh tài khoản nhận tiền chỉ khi đủ điều kiện. Chế độ demo không được coi là giao dịch ngân hàng thật.
5. Kiểm thử tiền: hủy Taxi sau khi xe xuất phát, chưa đón pet. Tiền mặt chưa thu giảm số phải thu; chuyển khoản đã ghi nhận thực thu dư dẫn tới hồ sơ hoàn, không tạo hoàn trùng.

## Phạm vi kiểm tra tự động

- Kiểm tra cú pháp TS/TSX và null-role guards.
- Backend unit/regression tests, có test riêng cho bố cục Tài chính, không lặp xác nhận thu dịch vụ.
- Chưa chạy end-to-end trên PostgreSQL localhost của người dùng và chưa xác nhận build frontend Vite đầy đủ trong môi trường tạo file.

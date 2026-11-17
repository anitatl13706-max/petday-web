# PetDay V6.130 — Tinh gọn trang chủ, Tổng quan và Đơn cửa hàng

## Thay đổi
- Xóa khối trắng “Chăm sóc bé yêu cùng PetDay” trùng nút CTA trong hero. Giữ CTA hero và danh sách dịch vụ bên dưới.
- Bỏ nhãn điểm đánh giá 4.9/5 và hơn 2.000 khách không có dữ liệu chứng thực.
- Tổng quan Admin chỉ hiển thị công việc khác với danh sách lịch trong ngày: lịch chờ xác nhận **trong tương lai**, và lịch hoàn tất chưa thu đủ; công việc quá hạn đã được auto-close không tạo hàng đợi trùng. Danh sách trống được ẩn.
- Lịch trong ngày chỉ giữ Tổng lịch / Chờ xác nhận; bỏ ô và nút Mở sổ thu tiền (trỏ tới mục Tài chính đã ẩn). Nút Mở lịch đi vào đúng lịch.
- Lịch hẹn: đối soát chuyển khoản cần thiết được thu gọn trong một mục mở rộng thay vì một panel thường trực.
- Đơn cửa hàng: bớt phần hướng dẫn nghiệp vụ dài, bỏ liên kết Admin → Tài chính không còn tồn tại. Với mỗi đơn chưa thanh toán, mở “Xác nhận thanh toán đơn này” ngay tại thẻ để đối soát đúng mã đơn. Không ghi nhận chuyển khoản chưa đối soát hoặc tiền mặt chưa thu.
- Chỉ giữ các trạng thái xử lý đơn hiện hữu, chức năng giao tận nhà / nhận tại quầy, lịch sử, và các chốt kiểm tra server. Không đổi bảng dữ liệu / PostgreSQL / chính sách đổi–hủy–hoàn của dịch vụ.

## Chạy ở Windows
1. Giải nén, sao lưu PostgreSQL TEST và giữ nguyên .env backend từ bản TEST đang hoạt động.
2. PowerShell thứ nhất: `cd "$env:USERPROFILE\Downloads\PetDay_V6_130_Admin_Shop_CleanUI\PETDAY_OFFICIAL"; npm install; npm run dev`
3. PowerShell thứ hai: `cd "$env:USERPROFILE\Downloads\PetDay_V6_130_Admin_Shop_CleanUI\PETDAY_OFFICIAL\server"; npm install; $env:PORT='4001'; npm start`
4. Đã cập nhật từ V6.129 thì không cần migration mới. Database TEST cần có các migration trước đó, bao gồm 063/064, nếu bản của bạn chưa áp dụng.

## Kiểm thử nhanh
1. Trang chủ: Không còn khối CTA trắng trùng, không còn 4.9/5 từ hơn 2.000 sen. Hai CTA chính vẫn điều hướng đúng.
2. Tổng quan: Không nhân đôi lịch chờ xác nhận hôm nay; không hiển thị cảnh báo quá hạn lịch đã được hệ thống xử lý tự động; lịch hoàn tất chưa thu vẫn mở được đúng lịch.
3. Lịch trong ngày: Không có “Mở sổ thu tiền”, bấm “Mở lịch” tìm đúng mã lịch ở Lịch hẹn.
4. Lịch hẹn: kiểm tra đối soát chuyển khoản chỉ hiện sau khi mở mục “Kiểm tra chuyển khoản cần đối soát”.
5. Đơn cửa hàng: tạo đơn nhận tại quầy trả tiền mặt chưa thu, mở thẻ “Xác nhận thanh toán đơn này”; chọn “Thu tiền mặt”, nhập mã biên nhận, xác nhận đúng tiền đã thực thu. Không xác nhận lại đơn đã paid.
6. Tương tự với chuyển khoản, đối chiếu thông tin trước khi xác nhận. Đơn hủy không được hiện nút thu tiền.
7. Xác nhận đơn cửa hàng giao tận nhà không tự báo giao thành công khi chưa có thao tác xác nhận thật; kiểm tra không hoàn kho/ghi nhận hoàn hai lần khi gửi lại yêu cầu.

## Kiểm tra kỹ thuật
- Kiểm tra cú pháp TS/TSX: 36/36 đạt.
- Bộ test backend node --test: 343/343 đạt.
- Chưa chạy build Vite hoàn chỉnh hay kiểm thử tích hợp PostgreSQL trực tiếp từ môi trường này; cần chạy trên máy người dùng trước khi coi là nghiệm thu chính thức.

## Lưu ý tiền thật
Không chuyển một khoản chờ chi trả thành “Đã hoàn tiền” nếu chưa có xác nhận chi trả thành công. Không tự đánh dấu đã thu tiền mặt hoặc chuyển khoản nếu chưa có bằng chứng thực thu.

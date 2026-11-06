# PetDay V6.67 — Quy trình tinh gọn

## Tài khoản và nhân viên
- Bản demo dùng **một tài khoản Admin** để vận hành. Không tạo Staff login mới.
- Vào **Quản trị → Nhân viên & phân công → Thiết lập 4 nhân viên** để bổ sung hồ sơ còn thiếu: Nguyễn Thanh Lam, Thiên Ân, Phụng Anh, Bảo Yến. Hồ sơ không phải tài khoản.
- Khi Admin duyệt lịch, hệ thống tự chọn người đang hoạt động, đúng chi nhánh và không trùng thời gian dịch vụ. Có thể thay người tại cùng màn. Không cần tạo ca. Với chi nhánh thứ hai, thay đổi chi nhánh hồ sơ hoặc tạo hồ sơ thích hợp theo nhu cầu.

## Dịch vụ / Pet Taxi
1. Khách đặt lịch tương lai: **Đang chờ xác nhận**, Taxi là yêu cầu đón (requested).
2. Admin **duyệt lịch**: chuyển **Đã xác nhận**, tự phân công nếu có người rảnh.
3. Taxi (nếu có) chỉ mở thao tác **Xác nhận xe nhận chuyến** trong 3 giờ trước lịch; **Đã đưa đến cơ sở** trong 90 phút trước lịch hoặc sau đó, và không cho thao tác sau 6 giờ. Thao tác taxi không đổi trạng thái lịch hoặc thanh toán.
4. Khi thú cưng thực sự có mặt, Admin ghi **Check-in / Bắt đầu** → Đang thực hiện; sau đó **Ghi nhận chăm sóc** → **Sẵn sàng bàn giao** → **Bàn giao / Hoàn tất**.
5. Chuyển khoản mô phỏng hoặc tiền mặt có thể được đối soát riêng qua **Tài chính**. Không đồng nhất thanh toán với chăm sóc hay Taxi.
6. Khách không đến: chỉ ghi nhận sau giờ hẹn 30 phút, khi chưa check-in; đơn đã trả tiền không tự hoàn.

## Đơn cửa hàng riêng
- Customer: **Cửa hàng → Giỏ hàng → Nhận tại cửa hàng / Giao tận nhà → Lịch sử mua**.
- Admin: **Quản trị → Đơn hàng cửa hàng**.
- Cả hai: Chờ xác nhận → Đã xác nhận → Sẵn sàng nhận / đóng gói.
- Nhận tại quầy: xác nhận đã thu tiền → xác nhận đã giao tại quầy → Hoàn tất.
- Giao tận nhà: nhập ngày giao dự kiến → Đang giao → xác nhận đã thu tiền → xác nhận giao thành công → Hoàn tất. Với chuyển khoản, cần đối soát trước khi giao.
- Thanh toán dịch vụ và thanh toán đơn cửa hàng dùng hai sổ nghiệp vụ riêng; cùng quy tắc ghi nhận chứng từ, không tự ghi đã thanh toán từ checkbox khách.
- Chỉ có một vai trò Admin vận hành; không tách thêm giao diện Staff trong phiên bản demo này.

## Migration
- **039_v667_retail_delivery_status.sql**: chỉ chạy **một lần** trên PostgreSQL TEST đã backup sau khi xác nhận cấu trúc hiện có. Chỉ phục vụ trạng thái shipping và trường delivery_eta của đơn hàng. Không chạy lại 001–038.

## Giới hạn kiểm thử
- Các bài test Node là test logic, không thay cho kiểm thử tích hợp PostgreSQL, UI thực tế.
- Vui lòng kiểm thử hai loại đơn và hai phương thức thanh toán tại database TEST.
- Chế độ `PETDAY_DEMO_PAYMENT=true` chỉ mô phỏng; không dùng tài khoản ngân hàng thật.

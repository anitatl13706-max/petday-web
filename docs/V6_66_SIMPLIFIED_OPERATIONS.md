# PetDay V6.66 — Quy trình lịch hẹn và nhân sự tinh gọn

## Những thay đổi đã thực hiện

- Admin có tab riêng **Nhân viên & ca trực**. Danh sách lịch hẹn chỉ nằm trong tab **Lịch hẹn**, không chen vào các tab khác.
- Admin có thể chọn nhân viên thực tế, tạo ca theo đợt **7/14/30 ngày** (5 khung giờ mỗi ngày). Nút này **không tự tạo tài khoản** và chỉ dùng khi người đó thực sự trực đủ các khung giờ.
- Khi Admin duyệt một lịch, Backend tìm nhân viên đang hoạt động tại đúng chi nhánh, có ca đúng ngày và giờ, và chưa nhận lịch khác cùng khung giờ. Phân công và ghi audit trong một transaction.
- Nếu không có nhân viên phù hợp, lịch vẫn **Đã xác nhận** nhưng **Chờ phân công**; Admin cần điều phối trước check-in. Không tự nhận nhân viên không có ca.
- Những lịch đã duyệt trước khi tạo ca: tab **Nhân viên & ca trực** → **Tự phân công lịch đang chờ**.
- Pet Taxi chờ điều phối **không chặn duyệt dịch vụ**. Trạng thái Taxi, thanh toán và chăm sóc không được dùng thay cho nhau.
- Không có migration SQL mới; dùng schema V6.65 có bảng staff_members, staff_shifts, booking_assignments và staff_assignment_events.

## Luồng vận hành khuyến nghị

1. Admin tạo 2–3 hồ sơ nhân viên thực tế theo chi nhánh; cấp tài khoản riêng nếu nhân viên cần đăng nhập.
2. Admin cấu hình lịch làm việc cho 7/14/30 ngày. Nếu chỉ làm một số giờ, dùng mục điều chỉnh ca lẻ và **không tạo tràn ca**.
3. Khách đặt lịch trước 2–3 ngày. Admin duyệt lịch; hệ thống tự phân công nếu có nhân viên hợp lệ, nếu không báo chờ phân công.
4. Admin xác nhận điều phối Taxi nếu khách sử dụng; taxi không thay thế check-in. Nếu khách tự đến thì bỏ bước Taxi.
5. Khi thú cưng **thực sự đến cơ sở** và được tiếp nhận, nhân viên check-in để chuyển **Đang thực hiện**.
6. Nhân viên ghi chăm sóc → sẵn sàng bàn giao → bàn giao để chuyển **Hoàn tất**.
7. Thanh toán tiền mặt: đối soát thủ công tại cơ sở (thường lúc bàn giao). Chuyển khoản mô phỏng: có thể ghi nhận sớm; việc ghi nhận không tự bắt đầu dịch vụ.
8. Taxi không gặp khách hoặc khách không đến: xử lý ngoại lệ riêng; không tự chuyển trạng thái chăm sóc.

## Kiểm thử bắt buộc trên PostgreSQL TEST

- Tạo 2 nhân viên cùng chi nhánh và ca cùng giờ, duyệt hai lịch cùng giờ: hệ thống chọn hai người khác nhau.
- Duyệt lịch khi không có ca: lịch vẫn được duyệt và ở Chờ phân công.
- Tạo ca theo đợt và phân công các lịch đang chờ; chạy tạo ca lần hai không nhân đôi dòng.
- Đăng nhập tài khoản nhân viên: chỉ thao tác lịch được phân công.
- Taxi chưa điều phối không cản Admin duyệt lịch; xác nhận chuyển khoản không tự xác nhận Taxi hoặc check-in.
- Lịch đã thanh toán, khách không đến: đánh dấu no-show theo chính sách; tiền được xử lý riêng.
- Thử concurrency hai phiên Admin duyệt hai lịch cùng giờ, đảm bảo không giao trùng một nhân viên.

Đã kiểm tra syntax React/Backend và chạy unit test của Backend. **Chưa kiểm thử end-to-end trên PostgreSQL của người dùng.**

# PetDay V6.22 — Đặt Pet Taxi và tối ưu giao diện

## Phạm vi thật
- Dịch vụ Pet Taxi **chỉ đăng ký một lượt đón**; chưa tích hợp bản đồ, điều phối xe thực, GPS hay phí tính theo km.
- Hai mức phí mẫu **70.000đ gần cơ sở** và **120.000đ khu vực mở rộng**, Admin cần xác thực mức giá/địa bàn trước khi sử dụng thực tế. Không quảng cáo như giá dịch vụ đã được xác nhận ngoài đời.
- Khách chỉ nhập yêu cầu khi đặt lịch; nhập địa chỉ 12–250 ký tự và số điện thoại hợp lệ; giá tính bởi backend và lưu trong line_items.
- Trạng thái Pet Taxi được tách riêng khỏi trạng thái booking và thanh toán: requested → confirmed → completed.
- Admin xác nhận điều phối trước khi xác nhận lịch có Pet Taxi. Không được tự thu tiền chỉ vì đã chọn Pet Taxi.
- Nếu không thể nhận chuyến, Admin liên hệ khách, giải quyết bằng đổi hoặc hủy lịch, không tự sửa tổng tiền hoặc tự động trừ phí.
- Thông báo cho khách khi xác nhận điều phối hoặc hoàn thành chuyến đón.

## Cài đặt
1. Sao lưu PostgreSQL `petday`.
2. Cần migration 001–017 đã chạy. Chỉ chạy `database/018_v622_pet_taxi.sql` một lần trong pgAdmin.
3. Chuyển file `server/.env` đang hoạt động từ V6.21. Không gửi khóa bí mật công khai.
4. Tắt backend/frontend cũ. Chạy `npm install && npm run dev` riêng trong `server/` và root `PETDAY_OFFICIAL/`.
5. Kiểm tra `/api/health/schema` có `schemaReady:true` rồi thử đặt lịch.

## Kiểm thử nghiệm thu trên môi trường của người dùng
1. Chọn không dùng taxi: tổng tiền không có phí Taxi, không có hàng trong pet_taxi_requests.
2. Chọn gần cơ sở: tổng tiền tăng đúng 70.000đ. Chọn mở rộng: tăng đúng 120.000đ.
3. Thiếu địa chỉ/sai số điện thoại: không cho đặt, API cũng từ chối nếu bypass UI.
4. Mã ưu đãi: tổng hiển thị và tổng sau khi đặt phải trùng nhau.
5. Customer chỉ thấy Pet Taxi thuộc lịch của mình, Staff không nhìn thấy số điện thoại/địa chỉ từ danh sách API.
6. Admin thử xác nhận lịch chưa điều phối: bị từ chối 409. Xác nhận taxi → xác nhận lịch → đánh dấu đã đón.
7. Kiểm tra chuyển khoản/tiền mặt, no-show, đổi lịch và hoàn tiền không bị thay đổi bất ngờ.
8. Kiểm tra mobile 375px, tablet 768px, desktop 1440px; tab Admin không cắt nút thao tác, form không tràn ngang.

## Giới hạn và điểm còn cần làm
- Phí taxi là bảng giá giả định để triển khai nghiệp vụ, chưa được xác minh theo địa giới cụ thể.
- Chưa có hỗ trợ chuyến trả về, xe/nhân viên lái xe, thời gian ETA, kiểm tra đường đi, tự hủy hoặc hoàn tiền phí Taxi riêng.
- Chưa chứng minh build và E2E đầy đủ trên PostgreSQL của người dùng.
- Giao diện các tab Admin hiện vẫn dùng CSS để ẩn/hiện một số section có sẵn; cần kiểm thử tương tác thực tế.

## Cấu trúc tham khảo
MoeGo: lịch vận hành tập trung, thao tác theo nhân viên/ngày; Gingr: phiếu lịch gắn thông tin thú cưng.
Nguồn: https://help.moego.pet/en/articles/14008213-grooming-calendar-view-desktop-overview và https://support.gingrapp.com/hc/en-us/articles/29335503915277-Appointment-Cards-Topic-Outline

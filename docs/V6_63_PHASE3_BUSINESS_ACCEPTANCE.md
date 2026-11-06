# PetDay V6.63 — Giai đoạn 3: Dịch vụ & nghiệp vụ

## Các phần đã có sẵn trong V6.62 và được giữ lại
- 8 gói thuộc Grooming, Spa, Daycare; ảnh tại `/public/services/`; mô tả, thời lượng và giá lấy từ hệ thống.
- Lịch theo chi nhánh, giờ và sức chứa; giá và điều kiện loài/cân nặng kiểm tra tại backend, không tin giá client.
- Tối đa 3 add-on phù hợp từng gói và tối đa 3 sản phẩm gợi ý mua kèm; khách không bắt buộc mua.
- Dịch vụ thứ hai là một lịch riêng, kiểm tra trùng thời gian và sức chứa.
- Pet Taxi chỉ là yêu cầu đón; nhân viên xác nhận thủ công; phí theo vùng là **tạm tính**.
- Chuyển khoản: Admin cấu hình ngân hàng → Customer gửi thông báo → Admin đối soát số tiền thực tế và ghi mã giao dịch → cập nhật trạng thái. Không có webhook ngân hàng tự động.
- Hủy, đổi lịch, hoàn tiền đều có trạng thái và quy trình xử lý ở API; không tự ghi nhận hoàn tiền khi chỉ duyệt yêu cầu.

## Nâng cấp trong V6.63
1. Backend bổ sung quy tắc độ tuổi: Daycare hiện nhận chó từ 6 tháng (age >= 0.5 năm). Đây là chính sách minh họa đồ án, không phải khuyến nghị thú y; cần xác nhận lại nếu áp dụng thực tế. Quote và tạo lịch đều dùng cùng quy tắc.
2. Khi Admin duyệt đổi lịch, khóa giao dịch theo pet/ngày và so sánh chồng lấn các lịch khác cùng pet, kể cả lịch ở chi nhánh khác; trước đây chỉ kiểm sức chứa tại giờ đến.
3. Màn chọn dịch vụ hiện điều kiện loài, cân nặng, tuổi và thông tin pet đã chọn. Phân biệt lịch thứ hai với add-on.
4. Làm rõ Pet Taxi là báo phí theo vùng tự chọn và nhân viên phải xác minh thủ công.
5. Làm rõ 3 sản phẩm là **gợi ý mua kèm**, không phải giới hạn giỏ hàng của Cửa hàng độc lập.

## Checklist kiểm thử bắt buộc trên PostgreSQL TEST (chưa xác nhận trong môi trường tạo source)
- Chó 0.3 tuổi → đặt Daycare: backend phải trả 422; chó 0.5 tuổi đủ điều kiện tuổi (còn phụ thuộc cân nặng, giờ, capacity).
- Mèo → Daycare: bị từ chối. Chó trên 30 kg → Daycare: bị từ chối.
- Đặt Grooming 08:30 rồi đặt Spa cùng pet 08:30 → API từ chối trùng giờ. Đặt Spa 10:00 sau Grooming 08:30 → được xét khả dụng riêng.
- Tạo 2 lịch hợp lệ cho cùng pet cùng ngày, đề nghị đổi lịch thứ hai trùng giờ lịch thứ nhất → Admin duyệt: HTTP 409.
- Khóa giờ hoặc đầy công suất → không được đặt.
- Kiểm tra giá/công dụng add-on; thử thêm add-on sai gói → API phải từ chối.
- Pet Taxi tự chọn vùng gần nhưng địa chỉ không rõ → nhân viên **không** được xác nhận khi chưa kiểm tra; đón taxi có trạng thái requested→confirmed→completed.
- Chuyển khoản: Customer gửi thông báo vẫn `Chưa thanh toán`; Admin chỉ ghi `Đã thanh toán` sau khi kiểm tra thực nhận và mã giao dịch; test trùng mã.
- Yêu cầu hủy lịch đã thanh toán → cần luồng hoàn tiền riêng; không được tự hoàn.
- Duyệt đổi lịch có Pet Taxi → trạng thái taxi trở về requested để điều phối lại.

## Giới hạn còn lại
- Chưa có geocoding, bảng giá theo phường/xã hoặc API ngân hàng. Phí taxi vẫn do khách chọn vùng và nhân viên xác minh.
- Chưa test E2E cùng PostgreSQL TEST thực của người dùng.
- Khung giờ và capacity hiện định nghĩa trong code; không phải lịch nhân viên thực tế từ Google Calendar.

## Chạy
- Giải nén ZIP; mở `PETDAY_OFFICIAL`, sao chép `server/.env` từ phiên bản chạy ổn.
- Backend: `cd PETDAY_OFFICIAL/server && npm install && npm run dev`.
- Frontend: `cd PETDAY_OFFICIAL && npm install && npm run dev`.
- Không có migration SQL mới cho bản này.

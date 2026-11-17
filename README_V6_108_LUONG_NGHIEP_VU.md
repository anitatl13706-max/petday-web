# PetDay V6.108 – Đồng bộ luồng nghiệp vụ tự phục vụ

## Đã sửa trong mã nguồn
- Một handler duy nhất xử lý POST /api/bookings/:code/cancellation-request và PATCH /api/bookings/:code/cancel: kiểm tra quyền sở hữu, trạng thái dịch vụ, giờ hủy, Taxi, ghi audit và tính số tiền hoàn dựa trên tiền thực thu. Cả hai API đều yêu cầu `reason` dài từ 10 ký tự.
- Giao diện không còn nút hủy nhanh đi vào luồng cũ thiếu lý do. Khách dùng biểu mẫu hủy có lý do duy nhất.
- Taxi chưa xuất phát được khách tự hủy/tự đến, hoặc Taxi đã xuất phát được xác minh chưa đón thú cưng (50%), hoặc lỗi PetDay (100%): tự mở hồ sơ hoàn phí trạng thái **approved** nếu có tiền thực thu dư để hoàn. Không hoàn trùng theo `taxi_leg_id`, khóa bản ghi trong giao dịch DB.
- Khi khách tự hủy dịch vụ, các chiều Taxi chưa xuất phát đóng lại và hồ sơ hoàn Taxi đủ điều kiện được tạo tự động.
- Gỡ nút Admin duyệt thủ công cho lịch bình thường trong giao diện điều hành (API phục hồi trạng thái cũ vẫn còn).
- Thông báo chuyển khoản phân biệt khách khai báo và giao dịch đã xác minh.

## Những giới hạn không được che giấu
- Chưa có tích hợp cổng ngân hàng hoặc webhook có chữ ký => chuyển khoản THẬT vẫn cần đối soát. Không thể tự giả lập thành tiền đã nhận.
- Hoàn tiền chỉ được tự quyết định **đủ điều kiện**; chuyển tiền hoàn về tài khoản chưa tự động vì chưa có API trả tiền. `approved` không phải `completed`.
- Đổi lịch Daycare gồm cả giờ về vẫn cần triển khai thêm với schema và sức chứa đúng. Không tự động đổi giờ về bằng cách chỉ đổi `slot`.
- Trường hợp Taxi đã xuất phát/No-show cần sự kiện thực tế được xác minh; không tự suy đoán từ việc khách bấm nút.
- Chính sách hoàn phí **dịch vụ chăm sóc** trong mã nguồn còn nguyên (100/80/0), chưa được người dùng chốt thành chính sách mới.
- Chưa tích hợp tài xế/xe trống, chưa bỏ toàn bộ điểm tương tác Admin ở các trường hợp ngoại lệ.

## Cài đặt/kiểm thử
- Sao lưu PostgreSQL và V6.107 trước khi test; không chạy SQL migration mới.
- Frontend: vào PETDAY_OFFICIAL chạy `npm install`, `npm run build`, `npm run dev`.
- Backend: vào PETDAY_OFFICIAL/server, sao chép `.env` hợp lệ, `npm install`, `npm test`, chạy PORT=4001.
- Test hủy chưa thanh toán, hủy đã thanh toán, khách hủy Taxi chưa khởi hành, hủy lặp lại, đổi lịch 3 giờ/1 giờ, Taxi en_route, no-show và kiểm tra không tạo `completed` refund khi chưa chuyển tiền.

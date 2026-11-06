# PetDay V6_86 – Trung tâm xác nhận thanh toán

- Admin → Tài chính → Trung tâm xác nhận thanh toán → Dịch vụ/Cửa hàng.
- Tab Dịch vụ sử dụng API và kiểm soát đối soát cũ của V6_85.
- Tab Cửa hàng hiển thị chuyển khoản chờ xác nhận; có nhóm riêng cho thu tiền mặt.
- Admin → Đơn cửa hàng giữ quản lý giao nhận, nhưng không còn nút xác nhận thu tiền trùng.
- Phía khách hàng vẫn dùng biểu mẫu đã triển khai ở V6_83–V6_84.
- Chưa phát sinh migration mới. Kiểm tra schema từ các phiên trước trước khi chạy.
- TEST: tạo lịch chuyển khoản và đơn cửa hàng chuyển khoản → khách báo chuyển → Admin Tài chính chọn tab tương ứng → xác nhận → tải lại để kiểm tra trạng thái. Kiểm tra không xác nhận hai lần.
- Lưu ý: ở môi trường thử nghiệm, nút xác nhận không chuyển tiền qua ngân hàng.

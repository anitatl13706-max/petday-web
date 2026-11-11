# PetDay V6.104.4 — chính sách hủy Pet Taxi sau khi xe xuất phát

- **Trước khi xe xuất phát:** khách hủy, hoàn dự kiến 100% phí chiều Taxi.
- **Sau khi xuất phát, nhưng chưa đón pet:** Customer bấm **Yêu cầu hủy**; Admin xác minh pet chưa được đón, nhập lý do ít nhất 8 ký tự và đánh dấu xác nhận; chiều Taxi chuyển **Đã hủy** với hoàn dự kiến **50%** phí chiều đó.
- **Xe đến đúng hẹn, khách vắng mặt, đã xác minh:** hoàn 0%.
- **Lỗi PetDay:** hoàn 100% phí chiều đó.
- **Chuyến đã hoàn tất / đã bàn giao pet:** không thể hủy theo luồng 50%.
- **Lỗi chưa rõ:** chờ xác minh; không tự hoàn tiền.

Khoản 50% được làm tròn **xuống đồng Việt Nam** nếu phí lẻ. Việc hủy Taxi không tự hủy lịch chăm sóc hoặc chiều Taxi còn lại. Hoàn tiền chỉ là dự kiến cho đến khi Admin tạo hồ sơ → duyệt → xác nhận đã hoàn, có mã đối soát; không có chuyển khoản ngân hàng tự động.

**Không có migration mới:** tái sử dụng `state=cancelled`, `customer_plan=ask_cancel` và `refund_due` hiện có, cùng lịch sử sự kiện `cancel_customer_departed`. PostgreSQL local phải đã áp dụng các migration đến 053.

**Kiểm thử ngắn:** 1) Khách đặt Taxi, Admin xác nhận, xuất phát; 2) Customer gửi yêu cầu hủy; 3) Admin xác minh pet chưa đón, nhập lý do và chốt; 4) Phí chiều 70.000đ → dự kiến hoàn 35.000đ; 5) Tài chính lập, duyệt, hoàn và Customer xem; 6) Không thể chốt hủy khi đã hoàn tất hoặc không có yêu cầu khách. Kiểm thử bằng tiền mô phỏng.

## Sửa vòng phụ thuộc chăm sóc / Taxi chiều về
- Chăm sóc: Check-in → Bắt đầu → Hoàn tất (không bắt buộc Taxi về đã xong).
- Taxi chiều về: chỉ được xuất phát khi dịch vụ chăm sóc đã Hoàn tất; không cần nút Sẵn sàng bàn giao.
- Trạng thái lịch Hoàn tất chỉ có nghĩa chăm sóc đã xong; Taxi chiều về có thể còn hoạt động riêng.

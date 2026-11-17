PETDAY V6.124 - TỰ ĐỘNG HỦY LỊCH & GHI NHẬN HOÀN TIỀN THEO CHÍNH SÁCH

- Khách đủ điều kiện tự hủy và nhận kết quả không cần Admin phê duyệt.
- Tiền Taxi add-on đi cùng tổng phí lịch hẹn, không lập hoàn Taxi riêng trên đường hủy lịch.
- Có thanh toán thật: khoản hoàn được tự động tính và ghi nhận ở trạng thái Đang chờ chi trả.
- KHÔNG tự đánh dấu Đã hoàn tiền nếu không có thông báo chuyển tiền thành công từ nhà cung cấp thanh toán.
- Hủy lịch / hoàn tiền lưu trong một transaction PostgreSQL; giới hạn tối đa tiền đã thu.
- Tài chính: xem lịch sử và khoản chờ chi trả, không hiện nút duyệt yêu cầu thông thường.
- Không đổi / xóa dữ liệu PostgreSQL; không có migration mới.

ĐỂ CHUYỂN TIỀN TỰ ĐỘNG THẬT: tích hợp API hoàn tiền ngân hàng/cổng thanh toán và webhook xác thực đối soát; hiện chưa được tích hợp trong dự án.

CHẠY: Mở PowerShell tại PETDAY_OFFICIAL: npm install; npm run dev.
Mở PowerShell khác tại PETDAY_OFFICIAL/server: npm install; npm start.
Phải cấu hình server/.env kết nối PostgreSQL riêng trước khi chạy.

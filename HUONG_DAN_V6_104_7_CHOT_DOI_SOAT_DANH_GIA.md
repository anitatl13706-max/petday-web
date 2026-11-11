# PetDay V6.104.7 — Gọn giao diện & đối soát nhất quán

## Những thay đổi thật sự trong source
- Bỏ ô **Đối soát phí Taxi và thanh toán** ở Tài chính vì trùng API tra cứu với **Hóa đơn & đối soát** của từng lịch. Tài chính vẫn giữ Sổ thu tiền; các hồ sơ hoàn gộp vào một khu với 2 tab **Dịch vụ/Cửa hàng** và **Pet Taxi**. Không xóa bảng hay lịch sử nào.
- Phần đánh giá dịch vụ đã hoàn tất: bấm 1–5 ngôi sao, viết nhận xét và Gửi đánh giá. Chỉ khi lịch Hoàn tất và chưa có đánh giá.
- Phân biệt rõ phí Taxi **miễn/giảm** (chưa thu) với khoản **xét hoàn** (đã thu dư).
- API `/api/health/schema` kiểm tra bổ sung các cột cần cho đối soát tài chính. Khi API hóa đơn trả HTTP 503 thiếu cấu trúc, thông báo gợi ý xem dòng `[schema-mismatch]` trong Terminal backend; không khuyên chạy lại migration 009–020 thiếu căn cứ.

## Quy tắc tài chính không thay đổi
1. Chưa thực thu: điều chỉnh trên hóa đơn / số còn phải thu, không tạo hồ sơ chuyển hoàn.
2. Đã thu dư: Tài chính xét hoàn; tạo → duyệt → ghi nhận hoàn có mã tham chiếu.
3. Cash và QR dùng cùng phí sau điều chỉnh; QR tự khai đã chuyển KHÔNG đồng nghĩa tiền đã vào tài khoản.
4. Xe xuất phát chưa đón pet, khách yêu cầu hủy: Admin xác minh rồi chốt 50% phí phải chịu. Trước xuất phát hủy hợp lệ: 0% phí; khách vắng mặt hợp lệ: 100% phí; lỗi PetDay: 0% phí.
5. Chăm sóc Check-in → Bắt đầu → Hoàn tất; Taxi chiều về độc lập sau hoàn tất chăm sóc.

## Kiểm thử trên PostgreSQL local
A. Một lịch Grooming không Taxi → Check-in → Hoàn tất → Customer đánh giá 4 sao và nhận xét → F5 thấy 4 sao, không đánh giá trùng.
B. Tiền mặt chưa thu: Taxi 70.000đ hủy sau xuất phát nhưng chưa đón pet → trong Hóa đơn & đối soát giảm 35.000đ; không thấy hồ sơ tiền cần hoàn.
C. QR được Admin xác nhận thu: cùng tình huống → Tài chính có hồ sơ xét hoàn 35.000đ; không ghi hai lần.
D. Taxi hai chiều: hoàn tất chiều đón → Check-in/chăm sóc hoàn tất → chiều về mới được xuất phát; không lỗi 409.
E. Admin Tài chính không còn ô Tra cứu đối soát Taxi riêng; vẫn có Sổ thu tiền, Hoàn dịch vụ và Hoàn Taxi trong hai tab chung.

Lưu ý: Không cần migration mới nếu database local đã lên đến 055. Đây không phải chứng nhận đã kiểm thử end-to-end trên máy người dùng. Không sửa trạng thái trực tiếp bằng SQL.

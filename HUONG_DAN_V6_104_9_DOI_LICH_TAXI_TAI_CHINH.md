# PetDay V6.104.9 — Đổi lịch hai chiều, kiểm soát Taxi & đối soát

## Đổi lịch (không migration mới)
- Customer gửi yêu cầu đổi → Admin duyệt/từ chối.
- Admin mở chi tiết lịch, chọn **Đề xuất đổi lịch cho khách** → Customer đồng ý hoặc giữ lịch cũ.
- Mỗi lịch chỉ một yêu cầu đang chờ; lịch hẹn cũ chưa đổi khi chưa có quyết định.
- Cấm tự duyệt đề xuất của chính mình; giới hạn đổi thành công một lần theo chính sách hiện có; phải cách giờ hẹn hiện tại hơn 3 giờ.
- Kiểm tra ngày/giờ tương lai, thời lượng/slot, công suất, lịch pet bị trùng khi chấp thuận.
- Không tự động đổi giờ nếu đã có Taxi bắt đầu hoặc hoàn tất. Khi Taxi mới xác nhận chưa đi, chuyển về chờ điều phối lại sau khi lịch được đổi.

## Taxi và hoàn tiền (giữ cơ chế V6.104.8)
- Chăm sóc: Duyệt → Check-in → Bắt đầu → Hoàn tất.
- Taxi từng chiều: Xác nhận → Bắt đầu → Hoàn tất; kết thúc ngoại lệ cần lý do.
- Không cần chờ Taxi chiều về mới hoàn tất chăm sóc.
- Hủy trước xe xuất phát: miễn/hoàn 100% chiều đó; khách hủy sau khi xe đi và chưa đón pet: miễn/hoàn 50%; khách vắng mặt được xác minh: 0%; lỗi PetDay: 100%.
- Chưa thu tiền: giảm số phải thu của hóa đơn, không ghi hoàn tiền.
- Đã thu dư: lập/duyệt/xác nhận hồ sơ hoàn tiền trên số thực thu; không hoàn trùng hoặc vượt số đã thu.
- Không tự chuyển tiền. Khi chưa xác minh chuyển khoản, chưa ghi nhận thực thu.

## Test gọn trên localhost (dùng dữ liệu giả)
1. Customer đề xuất đổi lịch → Admin duyệt → Customer thấy giờ mới sau F5; Taxi chưa đi trở về chờ xác nhận điều phối.
2. Admin đề xuất đổi lịch → Customer đồng ý hoặc từ chối → trước khi đồng ý lịch cũ không thay đổi.
3. Taxi đã xuất phát → thử duyệt đổi lịch → phải bị chặn (409) và không thay đổi dữ liệu Taxi.
4. Tiền mặt chưa thu + hủy Taxi sau xuất phát chưa đón pet → giảm phí trên hóa đơn; không tạo tiền hoàn.
5. Chuyển khoản đã xác nhận + cùng tình huống → tạo hồ sơ hoàn phần thực thu dư; kiểm tra không thể hoàn hai lần.
6. Taxi hai chiều thành công → chăm sóc hoàn tất độc lập; chiều về được bắt đầu sau khi chăm sóc xong.

## Chạy
Sao chép server/.env từ V6.104.8. Đã cập nhật PostgreSQL đến migration 055 thì không cần SQL mới.
Backend: cd PETDAY_OFFICIAL/server; npm install; npm start.
Frontend: cd PETDAY_OFFICIAL; npm install; npm run dev.

## Phạm vi kiểm thử
Backend unit tests: 262/262 đạt. server.js qua node --check. Portal.tsx qua TypeScript transpilation diagnostics. Chưa kiểm thử E2E với PostgreSQL local của người dùng; không xác nhận thanh toán ngân hàng thực.

# PetDay V6.103.8 — Check-in độc lập và đồng bộ Pet Taxi

## Thay đổi
- Lịch đã xác nhận → Xác nhận pet đã đến (sự kiện `pet_arrived`, lưu người và nguồn bàn giao) → Bắt đầu dịch vụ (`check_in`) → Ghi chú chăm sóc → Sẵn sàng bàn giao → Hoàn tất.
- Backend từ chối bắt đầu khi không có `pet_arrived`. Người dùng không được chỉ nhấn 'Bắt đầu' để bỏ qua kiểm tra.
- Với Taxi chiều đón, pet phải có chuyến đã bàn giao hoặc khách đã bấm 'Tôi tự đưa pet đến' **trước khi xe xuất phát**. Nếu xe đã xuất phát, xử lý sự cố trước khi xác nhận tiếp nhận.
- No-show không được ghi sau khi có sự kiện tiếp nhận; đồng hồ No-show vẫn được kiểm tra bởi backend.
- Taxi chiều về chỉ được cho xe xuất phát sau khi nhân viên ghi 'Sẵn sàng bàn giao'. Không đồng nghĩa hoàn tất dịch vụ; phải bàn giao thú cưng trước khi hoàn tất.
- Hai chiều Taxi và khoản hoàn dự kiến vẫn độc lập, không tạo giao dịch tiền thật. Chưa tự quyết toán phí Taxi cùng phí hủy dịch vụ.

## Cài đặt
1. Dừng server/frontend các bản trước, sao lưu database PostgreSQL **local** `petday`.
2. Dùng pgAdmin Query Tool đúng database `petday`, chạy `database/052_v61038_pet_arrival_checkin.sql` (cần chạy `051` của V6.103.7 trước).
3. Copy `server/.env` từ bản cũ. Không commit `.env`, không gửi mật khẩu.
4. Trong thư mục `PETDAY_OFFICIAL/server`: `npm install && npm start`.
5. Trong thư mục `PETDAY_OFFICIAL`: `npm install && npm run dev`.

## Kiểm thử đề xuất
1. Chưa tiếp nhận: nút Bắt đầu dịch vụ bị khóa; gọi API trực tiếp trả HTTP 409.
2. Nhấn Xác nhận pet đã đến, ghi chú pet và chọn nguồn bàn giao, sau đó Bắt đầu dịch vụ mới được phép.
3. Lịch Taxi pickup chưa bàn giao / chưa ghi khách tự đưa: không tiếp nhận được.
4. Khách tự đưa pet đến trước lúc Taxi xuất phát: đánh dấu riêng chiều đón; lịch chăm sóc giữ nguyên; Check-in được phép.
5. Khi pet đã check-in, không thể ghi No-show.
6. Taxi chiều về chưa Sẵn sàng bàn giao: không cho xe xuất phát.
7. Taxi hai chiều: chiều đón thất bại không tự động hủy chiều về hay dịch vụ.
8. Admin / Customer tải lại xem lịch sử tiếp nhận, giờ và người thực hiện.

## Giới hạn
- Không kiểm thử được với PostgreSQL trên máy người dùng. Không thể xác minh chuyến Taxi thực tế chỉ từ thao tác Admin; Admin phải đối chiếu bàn giao ngoài đời.
- Dữ liệu lịch đã bắt đầu ở phiên bản trước tiếp tục sử dụng các sự kiện `check_in` cũ; chỉ những lịch chưa bắt đầu mới yêu cầu sự kiện tiếp nhận riêng.

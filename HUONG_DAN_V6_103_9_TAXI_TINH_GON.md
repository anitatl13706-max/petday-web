# PetDay V6.103.9 — Pet Taxi tinh gọn

## Quy trình

Mỗi chiều: Chờ xác nhận → Đã xác nhận → Đang thực hiện → Hoàn tất; ngoại lệ Đã hủy / Không thực hiện được / Chờ xác minh.

- Customer báo tự đưa pet đến trước khi xe xuất phát: đóng chiều đón, hoàn phí dự kiến cho chiều đó; lịch dịch vụ vẫn giữ nguyên.
- Admin xác nhận và điều phối giờ; bắt đầu chuyến; khi bàn giao thành công nhấn Hoàn tất. Không cần ghi từng cuộc gọi hay đợi đồng hồ 10 phút trên website.
- Không gặp khách: chỉ chiều đón, xe đã bắt đầu; Admin xác nhận đã đến đúng điểm, đã liên hệ và có căn cứ, bắt buộc ghi lý do ít nhất 8 ký tự. Hệ thống lưu lịch sử; không tự động hủy lịch dịch vụ. Nếu chưa rõ trách nhiệm, chọn Chờ xác minh và không quyết toán phí.
- Sự cố do PetDay: Admin ghi lý do, đánh dấu không thực hiện được và ghi nhận hoàn phí chiều đó dự kiến.
- Chiều về độc lập; chỉ xuất phát khi nhân viên đánh dấu pet sẵn sàng bàn giao.
- Bước Check-in thú cưng trước khi bắt đầu dịch vụ vẫn bắt buộc.
- Khoản miễn/hoàn dự kiến chưa phải chứng từ đã hoàn tiền, cần đối soát riêng; không tự động tạo chuyển tiền.

## Cài đặt

Giữ database PostgreSQL local đã áp dụng migration 051 và 052, không cần migration 053. Sao lưu database trước khi kiểm thử. Chuyển server/.env từ bản 6.103.8 sang bản này, không chia sẻ .env. Chạy npm install; npm start trong server và npm install; npm run dev trong PETDAY_OFFICIAL. Dừng backend cũ trên cổng 4000 trước.

## Kiểm thử quan trọng

1. Một chiều: confirm → depart → complete.
2. Hai chiều độc lập: chiều đón khách tự đi → chiều về vẫn có thể phục vụ.
3. Trước khi Depart: hủy chiều, phí hoàn dự kiến đúng.
4. Trong chuyến: Không gặp khách chỉ khi đã xác nhận đủ điều kiện và nhập lý do, lịch dịch vụ không hủy.
5. Lỗi PetDay: ghi nhận hoàn dự kiến, không xác nhận đã hoàn tự động.
6. Check-in trước bắt đầu chăm sóc; chiều về cần sẵn sàng bàn giao.
7. Giao diện Customer xem trạng thái sau khi tải lại.

**Giới hạn:** Quy tắc về phí đã phát sinh sau khi xe xuất phát nhưng khách yêu cầu dừng chưa được tự động quyết toán; cần Admin xác minh và quy định rõ trong chính sách.

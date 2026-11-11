# PetDay V6.103.7 — Quản lý sự cố Pet Taxi theo từng chiều

## Điểm mới
- Pet Taxi **chiều đón** và **chiều về** có trạng thái/phí độc lập, nhật ký thao tác của Admin và khách.
- Admin: xác nhận giờ điều phối → xuất phát → đến điểm đón → liên hệ (nếu không gặp) → bàn giao hoặc xử lý sự cố.
- Đánh dấu **Không gặp khách** chỉ khi xe đến đúng địa chỉ, không đến trễ quá 10 phút, chờ đủ 10 phút từ giờ đến/hẹn (mốc muộn hơn) và đã ghi nhận ít nhất 2 lần liên hệ.
- Khách báo **Tự đưa pet đến** trước khi xe xuất phát thì chiều đón chuyển sang `customer_self`; không tự hủy lịch dịch vụ và không tự hủy chiều về.
- Khách hủy chiều về chưa xuất phát thì chiều về được ghi nhận độc lập.
- Lỗi PetDay có trạng thái riêng, không quy trách nhiệm cho khách.
- Yêu cầu đổi/hủy lịch dịch vụ phải dùng quy trình Đổi lịch/Yêu cầu hủy lịch riêng. Không tự coi vắng mặt là yêu cầu hủy.
- Ghi nhận phần **phí miễn/hoàn dự kiến** trong từng chiều để đối soát. **Không tự tạo lệnh chuyển tiền hoặc tự đánh dấu đã hoàn.** Màn hình Tài chính hiện tại vẫn là nơi đối soát; phần hoàn Taxi riêng biệt cần xác nhận thủ công với chứng từ trước khi vận hành thật.
- Ghi nhận khách không đến *cơ sở* chỉ sau giờ nhận tối thiểu 15 phút (Grooming/Spa) hoặc 30 phút (Daycare); không tạo hồ sơ hoàn 100% tự động khi No-show.

## CẦN CHẠY MIGRATION — KHÁC VỚI CÁC BẢN TRƯỚC
1. Giữ V6.103.6 làm dự phòng, sao lưu PostgreSQL local (database `petday`) trước.
2. Tại **pgAdmin 4 → PostgreSQL 17 → Databases → petday → Query Tool**, mở `database/051_v61037_taxi_leg_incidents.sql` của V6.103.7 và thực thi. **Không chạy trên Neon / production.**
3. Migration chỉ tạo thêm hai bảng `pet_taxi_legs`, `pet_taxi_leg_events` và khởi tạo các chiều Taxi hiện có; không xoá lịch hay giao dịch.
4. Sao chép `server/.env` từ bản V6.103.6 sang bản mới; **không chia sẻ .env**. Dừng backend/frontend cũ bằng Ctrl+C.
5. Backend: `cd PETDAY_OFFICIAL/server` → `npm install` → `npm start`.
6. Frontend: mở PowerShell thứ hai → `cd PETDAY_OFFICIAL` → `npm install` → `npm run dev`.
7. Đăng nhập Customer hoặc Admin → Lịch hẹn → khối **Điều phối Pet Taxi theo từng chiều**.

## Các ca cần kiểm thử
- TX-01 Khách báo tự đưa pet đến **trước khi xe xuất phát**: miễn phí chiều đón; lịch Grooming vẫn giữ nguyên, khách check-in được khi tự mang pet đến.
- TX-02 Admin đã nhấn `Xe xuất phát`: khách **không thể** dùng thao tác trước xuất phát để yêu cầu miễn phí tự động.
- TX-03 Admin xác nhận giờ, xe xuất phát, đến đúng địa chỉ: chưa đủ 10 phút hoặc < 2 lần liên hệ → chặn Không gặp khách.
- TX-04 Đủ thời gian, >=2 lần liên hệ và đến đúng giờ → ghi No-show chiều đón; lịch chăm sóc không tự hủy.
- TX-05 Xe đến sai/đến trễ: không được quy trách nhiệm vắng mặt cho khách.
- TX-06 Taxi hai chiều: hủy riêng chiều đón trước xuất phát, vẫn còn chiều về.
- TX-07 Taxi chiều về chỉ được điều phối khi dịch vụ đã bắt đầu.
- TX-08 Admin ghi nhận sự cố: Customer nhìn thấy ngay sau khi nhấn Cập nhật Taxi.
- TX-09 Admin không dùng được API cập nhật Taxi cũ để bỏ qua quy trình ghi nhận.
- TX-10 Không ghi nhận hoàn tiền thực tế bằng việc chỉ đánh dấu sự cố; kiểm tra đối soát riêng.

## Phạm vi / điều kiện
- Admin cập nhật trạng thái dựa trên điều phối thực tế; **chưa có ứng dụng tài xế và chưa có xác thực GPS**. Vì vậy, bằng chứng đến đúng điểm vẫn là xác nhận có trách nhiệm của Admin.
- `refund_due` là **số phí chiều Taxi được đề nghị miễn/hoàn**, không phải chứng từ hoàn tiền; khi chưa thu tiền thì hiểu là phí được miễn, không phải tiền đã chuyển lại.
- Với các khoản hoàn một phần dịch vụ + Taxi và sản phẩm mua kèm, phải đối soát thủ công theo số tiền thực thu để tránh vượt tiền hoặc trùng khoản hoàn. Chưa triển khai sổ cái hoàn tiền Taxi độc lập với hồ sơ hoàn tiền của lịch dịch vụ.
- Không triển khai online cho đến khi kiểm tra migration, 10 ca test và đối soát hoàn tiền trên cơ sở dữ liệu thử nghiệm.

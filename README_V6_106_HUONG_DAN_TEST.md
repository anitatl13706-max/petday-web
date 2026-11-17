# PetDay V6.106 – Bản thử nghiệm 8 slot và Daycare linh hoạt

## Đã thay đổi

- 8 slot 90 phút liên tục trong giờ mở cửa 08:00–20:00: 08:00, 09:30, 11:00, 12:30, 14:00, 15:30, 17:00, 18:30. Gói có thời lượng dài không được bắt đầu nếu vượt 20:00.
- Đổi nhãn “Giờ phục vụ” thành “Khung giờ phục vụ”.
- Chỉ hiển thị một lựa chọn Daycare ở Customer: **Daycare linh hoạt** (vẫn dùng khóa dữ liệu `Daycare cả ngày` để tương thích dữ liệu cũ). Gói `Daycare nửa ngày` cũ chỉ còn trong mã backend để đọc lịch sử, không hiện cho khách khi tạo lịch mới.
- Khách chọn ngày đến, ngày về, giờ đến, giờ về; tối đa 7 ngày lịch. Mỗi ngày chỉ tính thời gian phục vụ 08:00–20:00; **KHÔNG có trông giữ qua đêm**. Phí là **40.000đ/giờ phục vụ**, tính theo bước 30 phút (20.000đ/nửa giờ). Ví dụ 08:00–12:00 = 160.000đ, 08:00–20:00 = 480.000đ, ngày 1 14:00 → ngày 2 11:00 = 360.000đ (9 giờ phục vụ).
- Daycare được chọn thêm một gói Spa **hoặc** Grooming có trong danh mục, tính thêm phí riêng.
- Tự xác nhận lịch khi điều kiện thanh toán/cọc đã được ghi nhận thực tế. Khách cũ chọn tiền mặt có thể được tự xác nhận ngay; khách lần đầu cần cọc chuyển khoản 20%; chuyển khoản thông thường vẫn chờ chứng cứ thanh toán. **Không tích hợp API ngân hàng, không tự ghi nhận tiền chỉ từ nút “Đã chuyển khoản”.**
- Các luồng tự động hủy/đổi lịch đủ điều kiện từ V6.105 được giữ lại. Hồ sơ hoàn có thể tự duyệt nhưng không tự ghi rằng tiền đã chuyển trả.

## Chạy tại máy

Mở thư mục `PETDAY_OFFICIAL` trong VS Code; Terminal thứ nhất chạy `npm install`, sau đó `npm run dev`. Thường Vite sử dụng cổng 8443 theo `vite.config.ts`; mở đúng URL mà Terminal hiển thị, không mặc định 5173. Nếu cổng đã bị chiếm, dừng tiến trình cũ trước khi chạy lại. Terminal thứ hai: `cd server`, `npm install`, `npm start` với `.env` **trỏ database TEST riêng**. Không đưa `.env` vào ZIP hoặc chia sẻ mật khẩu.

## Kiểm thử đã chạy

`node --test server/test/*.test.js`: 290/290 đạt. Cú pháp `src/Portal.tsx`, `src/Booking.tsx`, `src/servicePackages.ts` được kiểm tra bằng TypeScript parser. Không chạy được build Vite thực tế trong môi trường đóng gói do chưa có các dependency npm offline. Cần chạy `npm run build` trên máy của bạn và test tích hợp trước khi đưa lên production.

## Trước khi triển khai thật

- Test Daycare nhiều ngày với 2 tài khoản đặt trùng giờ; test kiểm tra công suất ở mỗi ngày.
- Test bổ sung Spa/Grooming trong Daycare với khung giờ/công suất thực và nhân viên được phân công. Cần thiết kế lịch thực hiện riêng cho gói kèm theo nếu vận hành thực tế.
- Không bật nhận tiền tự động hoặc hoàn tiền tự động nếu chưa tích hợp webhook/cổng thanh toán đáng tin cậy.
- Kiểm tra kỹ lịch cũ và chức năng đổi lịch Daycare qua nhiều ngày; cơ chế đổi lịch cũ chủ yếu điều khiển khung giờ bắt đầu.
- Không chạy trên Neon production trước khi sao lưu và kiểm thử với dữ liệu riêng.

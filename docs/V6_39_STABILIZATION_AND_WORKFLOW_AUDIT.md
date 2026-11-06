# PetDay V6.39 — ổn định đặt lịch & làm rõ nghiệp vụ (04/11/2026)

## Phạm vi bản này

Cơ sở: V6.38, giữ nguyên PostgreSQL và các migration 001–022. Không cần migration 023 cho những thay đổi của V6.39.

ĐÃ SỬA TRONG SOURCE:
- Bước 2: chọn dịch vụ theo **Grooming / Spa / Daycare** thay vì dàn 8 gói lẫn nhau. Mỗi gói có giá khởi điểm, thời lượng, loài phù hợp; chọn nhóm khác sẽ chọn gói hợp lệ đầu tiên cho thú cưng, giữ giá máy chủ làm nguồn quyết định.
- Bước 3: Pet Taxi là lựa chọn tùy chọn; báo lỗi địa chỉ ngắn hơn 12 ký tự hoặc điện thoại sai ngay trên form. Không áp phí nếu không chọn Taxi. Phí theo vùng là phí cố định ước tính, không phải tính quãng đường qua bản đồ.
- Bước 4: trải bố cục rộng hơn; chuyển khoản ngân hàng bị vô hiệu hóa nếu Admin chưa lưu tài khoản nhận tiền. Vẫn hiển thị giải thích; không giả mạo QR/giao dịch.
- API POST /api/bookings: khi gói thú cưng hoặc add-on không phù hợp, trả HTTP 422 rõ ràng thay cho HTTP 500 không có hướng dẫn.
- API lỗi CHECK của bookings: nếu còn ràng buộc ba gói cũ, trả HTTP 503 với chỉ dẫn SQL 022. Các CHECK khác trả HTTP 422 với mã ràng buộc để dễ chẩn đoán.
- API GET /api/health/services: kiểm tra **read-only** xem `bookings_service_check` chấp nhận đủ cả 8 tên gói; không sửa dữ liệu hoặc ràng buộc.

## Quan trọng — lỗi POST /bookings HTTP 500 trên máy người dùng

Chưa thể tái hiện trực tiếp với PostgreSQL của người dùng. Không được xem lỗi này là đã sửa hoàn toàn. Trình tự xác nhận:

1. Giữ lại bản sao lưu của `petday`. Không chạy lại SQL 001–021.
2. Chạy backend V6.39 bằng cấu hình `.env` của bản V6.38 đang hoạt động.
3. Mở `http://localhost:4000/api/health` và `/api/health/schema` để xác nhận kết nối.
4. Mở `http://localhost:4000/api/health/services`. `ok:true, missingServiceNames:[]` là điều kiện cần. Nếu 503 hoặc có gói thiếu, **đọc kỹ** migration `database/022_v638_service_packages.sql`, backup rồi chỉ áp dụng khi chưa làm. Không tự tạo/cập nhật ràng buộc ngẫu nhiên.
5. Customer thử đặt **Grooming cơ bản, không add-on, không Taxi, tiền mặt, không mã giảm giá** ở khung giờ hợp lệ; kiểm tra cả `/bookings` Network và log backend.
6. Thử gói Spa, add-on, Pet Taxi sau khi gói đơn giản đã lưu được. Nếu vẫn lỗi 500, lấy **dòng SQLSTATE và thông báo đầu tiên** từ Terminal backend (che thông tin riêng), không chạy lại migration theo phỏng đoán.

## Luồng chuyển khoản — phân biệt các trạng thái

- Admin > Tài chính > Thiết lập ngân hàng: tên ngân hàng, số TK, chủ TK hợp lệ. Không nhập mật khẩu ngân hàng hay thông tin thẻ.
- `/api/payment/options` xác nhận `bankTransfer.enabled = true`.
- Customer có thể chọn **chuyển khoản** tại bước 4, nhưng khi đặt lịch trạng thái phải là **Chưa thanh toán**.
- Sau khi đơn được tạo, khu vực Thanh toán của tôi cung cấp mã lịch, ngân hàng, tài khoản, chủ tài khoản. Khách chuyển khoản ngoài website; nội dung mã lịch.
- Admin kiểm tra tiền thực nhận trong hệ thống ngân hàng rồi nhập mã giao dịch vào Sổ thu tiền và xác nhận. Không tự động thay đổi thanh toán từ ảnh/số tham chiếu do khách khai báo.
- Chưa tích hợp VNPAY Sandbox, webhook/IPN, đối soát tự động hoặc QR được chứng thực. **Không quảng cáo là đã thanh toán tự động.**

## Luồng doanh nghiệp & ma trận năng lực

| Kịch bản / chức năng | Trạng thái theo mã nguồn V6.39 |
|---|---|
| Đăng ký / đăng nhập / sửa hồ sơ / phân quyền | Có API, cần chạy e2e |
| Quên mật khẩu | Luồng token có; cần cấu hình SMTP và test email thật |
| Pet Profile + ảnh + lịch sử | Có API; chưa tái hiện lỗi tải ảnh trên máy người dùng |
| Tra cứu / lọc / xem chi tiết dịch vụ | Có 8 gói, phân nhóm và chi tiết cơ bản; nội dung do source cấu hình |
| Dynamic Pricing | Server tính theo gói, cân nặng, add-on, Taxi, ưu đãi; giá kiểm lại khi POST |
| Khung giờ / công suất | Có preview và khóa giao dịch khi đặt; cần e2e chống trùng |
| Hủy / đổi / hoàn tiền | Có API và luồng duyệt; cần e2e kiểm tra toàn vẹn |
| Tiền mặt / chuyển khoản | Hai cách **thủ công**; chuyển khoản chỉ mở sau khi cấu hình TK |
| Đánh giá / kiểm duyệt | Có API và migration 021; cần e2e duyệt/ẩn |
| Admin khách hàng / nhân viên / KPI | Có nền tảng; cần đánh giá báo cáo theo dữ liệu thật |
| Nhắc lịch / Pet Taxi / Care Timeline | Có; nhắc tự động/email yêu cầu cấu hình riêng |
| Quản lý dịch vụ CRUD động theo database | **Chưa có** (8 gói hiện khai báo trong source) |
| Sản phẩm mua kèm + kho + đơn hàng | **Chưa có luồng bán hàng thật** |
| QR xác nhận ngân hàng / VNPAY tự động | **Chưa có** |

## Kiểm thử sau cài (theo mức ưu tiên)

1. Backend `/api/health`, `/api/health/schema`, `/api/health/services`.
2. Customer login, 8 gói xuất hiện, lọc nhóm, pet không đủ điều kiện bị khóa.
3. Customer chọn Grooming cơ bản, không add-on/taxi, tạo đơn tiền mặt; kiểm tra API và DB.
4. Nhập mã ưu đãi: nếu chưa xác minh phải hiện hướng dẫn; giảm giá theo server.
5. Chọn Pet Taxi: địa chỉ 5 ký tự báo lỗi; địa chỉ hợp lệ, điện thoại hợp lệ bật nút xác nhận. Tắt Taxi phải bỏ phí.
6. Cấu hình ngân hàng: `bankTransfer.enabled` false trước, true sau; thử đặt chuyển khoản, kiểm tra lịch **Chưa thanh toán**.
7. Admin xác nhận lịch → phân công ca → Staff check-in, cập nhật, sẵn sàng bàn giao → hoàn tất.
8. Admin đối soát tiền với mã giao dịch; khách xem trạng thái đã thanh toán.
9. Hủy lịch đã trả tiền → xét hoàn tiền thủ công; lịch sử không bị mất.
10. Customer đánh giá sau hoàn tất → Admin kiểm duyệt → công khai.
11. Chạy thử trên màn hình nhỏ, kiểm tra điều hướng tab và thông báo lỗi rõ ràng.

## Kết quả kiểm tra độc lập

- `npm test` phía `server`: **131/131** qua.
- `node --check server/src/server.js`: qua.
- TypeScript parse `src/*.ts(x)`: 22 file, không có lỗi cú pháp.
- **Chưa chạy được production build với dependencies đầy đủ**, chưa chạy e2e với PostgreSQL của người dùng, chưa chứng minh hết lỗi HTTP 500.

## Nghiên cứu cách tổ chức sản phẩm

- MoeGo: hành trình **thông tin pet → gói và add-on → giờ trống → thông tin bổ sung → thanh toán**, phương thức thanh toán tùy cấu hình; https://help.moego.pet/en/articles/13864029-pet-client-experience-grooming-booking-flow
- MoeGo: cấu hình dịch vụ, add-on, gói, sản phẩm bán lẻ là các mô-đun khác nhau; https://www.moego.pet/help/en/articles/13892601-getting-started-pricing-products-setup-guide
- Gingr: nhấn mạnh booking portal, add-ons, capacity và đặt lịch; https://www.gingrapp.com/pet-scheduling-software

Đây là tư liệu tham khảo nguyên tắc nghiệp vụ, **không sao chép giao diện hay khẳng định PetDay đã có tất cả tính năng của các sản phẩm trên**.

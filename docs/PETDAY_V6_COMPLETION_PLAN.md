# PetDay V6 — Blueprint hoàn thiện nghiệp vụ và nghiệm thu

Ngày lập: 2026-11-02. Tài liệu này là **kế hoạch triển khai**, không phải bằng chứng các chức năng đã hoạt động.

## I. Quy tắc hệ thống

- Một cơ sở dữ liệu PostgreSQL `petday`, một API Express, một frontend React. Không tách demo/API.
- Admin và customer có giao diện riêng; `admin` kiểm tra phía backend từ database, không dựa vào menu ẩn/hiện.
- Mỗi bước ghi nhận trên server phải kiểm tra quyền sở hữu; mỗi hành động có trạng thái thành công/lỗi và có bản ghi lịch sử tối thiểu.
- Trạng thái booking, thanh toán, phiếu tư vấn, taxi là **các trạng thái riêng**, tuyệt đối không suy ra thanh toán thành công từ booking được xác nhận.
- Không đưa địa chỉ, số điện thoại, ngân hàng hoặc review không có thật vào môi trường sản xuất. Trong đồ án phải đánh dấu dữ liệu mẫu hợp lý.

## II. Sơ đồ điều hướng

**Public**: Trang chủ | Dịch vụ (lọc, chi tiết) | Quy trình | Cẩm nang (bài viết thật) | Liên hệ | Đăng nhập/Đăng ký | Trợ lý / Nhân viên tư vấn.

**Customer**: Tổng quan tài khoản | Thông tin cá nhân | Thú cưng của tôi | Lịch hẹn & đổi/hủy | Pet Care Timeline | Thanh toán & chứng từ | Yêu cầu tư vấn | Đánh giá của tôi | Cài đặt bảo mật/Đăng xuất.

**Admin**: Tổng quan KPI | Lịch hẹn | Dịch vụ/giá | Lịch nhân viên & công suất chi nhánh | Khách hàng & thú cưng | Thanh toán/đối soát | Tư vấn | Nhật ký chăm sóc | Đánh giá | Thống kê | Cài đặt.

## III. Quy trình đặt lịch

1. Chọn thẻ thú cưng có ảnh; chỉ chủ tài khoản được dùng, yêu cầu cân nặng dương và thuộc nhóm loài hỗ trợ; chưa có hồ sơ phải tạo trước.
2. Chọn **dịch vụ chính**: cơ sở dữ liệu `services` gồm mô tả, loài/giới hạn cân nặng, thời lượng, giá cơ sở, trạng thái, chi nhánh khả dụng. Chọn add-on (liên kết dịch vụ/chỉ áp dụng hợp lệ), sản phẩm bổ sung (tồn kho), Pet Taxi (khu vực/phí và công suất). Gợi ý theo luật không tự đánh dấu mua.
3. Chọn chi nhánh, ngày, khung giờ có khả năng phục vụ **toàn bộ thời lượng**. Loại trừ ngày nghỉ, trùng lịch thú cưng, công suất nhân viên/thiết bị; backend kiểm tra và giữ chỗ khi đặt trong transaction.
4. Xác nhận: thẻ thú cưng, dịch vụ, add-on, sản phẩm, taxi, thời lượng, chi nhánh, lịch, chi tiết giá, phương thức thanh toán, chính sách hủy/đổi. Mã đơn sinh tại backend, lưu snapshot giá vào booking_items, idempotency key chống đặt trùng.
5. Vòng đời: `pending -> confirmed -> in_progress -> completed`; các nhánh cancel theo chính sách, no_show, reschedule (lưu lịch cũ/mới, chỉ đổi khi đủ chỗ). Chỉ admin/staff được xử lý trạng thái phù hợp.
6. Hoàn tất phải lưu biên bản chăm sóc và chỉ sau đó mới mở đánh giá một lần cho chủ lịch.

## IV. Thanh toán: lựa chọn và giới hạn

**Tiền mặt**: khách chọn tiền mặt -> `unpaid` -> tới cơ sở -> nhân viên nhận đúng số tiền -> quản trị có quyền cập nhật `paid` kèm người xác nhận, thời gian, mã booking. Nếu hủy trước khi thu, không ghi nhận hoàn tiền giả.

**Chuyển khoản**: chỉ cho khách nhìn thông tin ngân hàng/QR khi admin đã cấu hình và xác thực. Mã nội dung CK theo booking; `awaiting_transfer` -> khách gửi mã giao dịch/ảnh minh chứng tùy chọn (`submitted_for_verification`) -> admin đối chiếu tiền thực nhận -> `paid`, hoặc `rejected` và yêu cầu bổ sung. Không coi ảnh chụp là bằng chứng tiền đã về. Có quyền điều chỉnh, audit trail và chống xác minh hai lần.

**Có nên Admin đối soát thủ công?** Có, phù hợp đồ án quy mô nhỏ nếu UI nói rõ thủ công, có quy trình chờ, từ chối, lịch sử và không quảng cáo thanh toán tự động. Tích hợp cổng thanh toán/webhook mới cho đối soát tự động và phải ký/kiểm tra webhook và idempotency.

**Hoàn tiền**: chỉ phát sinh khi đã thu tiền; yêu cầu -> duyệt -> thực hiện ngoài hệ thống hoặc qua provider -> ghi chứng từ -> refunded, không thể hoàn quá số thực thu.

## V. Quên mật khẩu

V6 backend có API forgot/reset nhưng cần SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, RESET_BASE_URL đúng URL frontend đang chạy. Với localhost, link reset có thể là `http://localhost:8443/?reset_token=...` tùy cơ chế router. Dùng App Password/dịch vụ transactional mail. Không ghi mật khẩu/secret vào Git, tài liệu hoặc chat. Lưu token hash, 30 phút, một lần, trả cùng một thông báo cho email có/không có, rate limit, gửi email thông báo sau reset; yêu cầu đăng nhập lại. Về sau cần rate limit bền vững cho nhiều tiến trình, revoke session và gửi mail bất đồng bộ.

## VI. Upload ảnh Pet Profile

Luồng chuẩn: chọn file -> preview tức thời qua URL.createObjectURL -> validate MIME + magic bytes + size <= 2 MB -> POST `/api/pets/photo` kèm Bearer token -> server tạo tên random và URL `/uploads/...` -> PUT `/api/pets/:id` với `photoUrl` -> reload danh sách -> ảnh hiển thị. Khi API lỗi phải giữ ảnh cũ và hiện thông báo; khi thay ảnh tránh orphan file; khi xóa ảnh cần xác nhận xóa khỏi hồ sơ, việc xóa vật lý chỉ làm sau khi kiểm tra không còn tham chiếu. Truy vấn kiểm tra dùng cột `photo_url`, không phải `image_url`.

Lưu ý source V6 hiện tạo file upload trước khi người dùng lưu hồ sơ; nếu đóng form giữa chừng sẽ phát sinh file mồ côi. Cần thêm endpoint upload gắn với pet_id hoặc tác vụ dọn file tạm; production nên lưu cloud storage, giới hạn tốc độ và quét nội dung.

## VII. Chatbot và tư vấn người thật

- Trợ lý theo luật: chỉ trả lời trong phạm vi dữ liệu dịch vụ/FAQ công khai; muốn đặt/hủy/đổi phải chuyển sang UI xác nhận. Nếu gắn AI LLM thì tạo server-side key, retrieval từ catalog, lọc PII, không tự ý chẩn đoán thú y.
- Kênh người thật: khách đăng nhập tự điền tên/email; khách vãng lai tự khai. Tạo `consultation_request` với mã, thời điểm, topic, priority, status. Admin xem danh sách, phân công, trả lời bằng nội dung, lưu thời điểm/người trả lời, thông báo cho khách (trong tài khoản + email nếu cấu hình). `new -> in_progress -> replied -> closed`; khách có thể mở lại theo chính sách. Đây là **phiếu tư vấn**, không ghi nhãn chat trực tuyến nếu không có real-time websocket.
- Không hứa “nhân viên đang online” nếu chưa có hệ thống presence. Bảo vệ quyền truy cập và tránh lộ email/điện thoại.

## VIII. Danh mục dịch vụ đề xuất (chưa tính là đã triển khai)

Grooming: Tắm & sấy cơ bản; Grooming toàn diện; Cắt tỉa tạo kiểu; Vệ sinh tai/móng (đơn lẻ).
Spa: Spa dưỡng lông; Dưỡng ẩm da/lông; Gỡ rối lông (add-on theo đánh giá tình trạng); vệ sinh răng bằng chải (add-on, không thay điều trị nha khoa).
Daycare: Gói nửa ngày; gói cả ngày (chó đủ điều kiện, yêu cầu tiêm phòng nếu quy định của PetDay); chăm sóc một-một theo nguồn lực.
Pet Taxi: đón; trả; hai chiều; chỉ mở khi chi nhánh và khu vực khả dụng.
Sản phẩm mua kèm: đồ ăn vặt, phụ kiện vệ sinh, đồ chơi; kiểm tra tồn và áp dụng chính sách giao nhận.

Mỗi dịch vụ cần bảng riêng quản lý tên, ảnh, mô tả, thời lượng, giá, loài, cân nặng, chi nhánh, nhân viên, hoạt động; không tự nhân bản giá và hardcode riêng frontend/backend.

## IX. Quy tắc giao diện

- Header có một avatar/tên account + chevron SVG; bấm mở menu đúng vai trò, ESC và click outside đóng menu, hỗ trợ bàn phím.
- Các thẻ pet có ảnh, tên, giống, tuổi/cân nặng, tình trạng hồ sơ; thêm mới và chỉnh sửa mở modal hoặc trang riêng, không hiển thị form dài luôn ở mọi trạng thái.
- Dịch vụ hiển thị card ảnh/mô tả/thời lượng/giá **từ** có quy tắc; không chọn dịch vụ không phù hợp loài.
- Bước cuối Booking: hai cột desktop — trái chi tiết đặt lịch, phải đơn giá/điều khoản và CTA; mobile xếp một cột. Hiện trạng thái thanh toán đúng ngữ nghĩa và lời nhắc không nhập dữ liệu nhạy cảm.
- Footer: đường dẫn thực hoặc text không tương tác; dữ liệu liên hệ xác minh; bài viết phải mở trang chi tiết và hiển thị nội dung thật.

## X. Ma trận nghiệm thu tối thiểu

1. Customer/Admin đăng nhập: đúng vai trò, không vượt quyền qua URL/API.
2. Forgot: email tồn tại/không tồn tại cùng thông báo, token một lần/hết hạn, đổi pass xong login lại.
3. Pet: thêm/sửa/ảnh/xóa hợp lệ, sai chủ sở hữu 403/404; pet có lịch sử không mất lịch.
4. Dịch vụ: lọc theo loại, giống/loài, active, chi nhánh; bảng giá thống nhất server/UI.
5. Booking: hết chỗ, ngày quá khứ, cùng pet trùng giờ, nhấn đôi, admin xác nhận, đổi/hủy đúng cửa sổ.
6. Tiền mặt: chỉ admin xác nhận sau nhận; chuyển khoản chưa xác minh vẫn unpaid; từ chối chứng từ sai; hoàn không vượt paid.
7. Hoàn thành: nhật ký một lịch, đánh giá một lần; lịch chưa hoàn thành không review.
8. Tư vấn: khách xem đúng phiếu của mình, Admin trả lời lưu DB, khách nhìn thấy sau refresh.
9. Add-on/taxi/sản phẩm: số tiền cộng chính xác, tồn/công suất và rollback transaction khi lỗi.
10. Giao diện: desktop/tablet/mobile, keyboard, loading/empty/error/success, tất cả links không inert.

## XI. Trạng thái hiện tại so với kế hoạch

**Đã có trong source V6 phục hồi:** API auth, forgot/reset (chưa cấu hình SMTP), Pet Profile API và upload file, dịch vụ 3 gói cố định, Booking cơ bản, admin xử lý status, thanh toán đánh dấu thủ công, review, care record và tư vấn hai chiều cơ bản.

**Chưa hoàn thành end-to-end:** email gửi thật, catalog/giá từ database, đổi lịch, giữ chỗ đồng thời, tiền chuyển khoản có chứng từ/audit, add-on, sản phẩm, Pet Taxi, tự động nhắc lịch, dashboard KPI, chatbot AI tạo sinh, hoàn tiền, kiểm duyệt đánh giá, lịch sử giá, xóa ảnh an toàn, realtime chat. Không công bố là hoàn thành nếu chưa có mã/kiểm thử.

**Migration `005_v6_extension_DRAFT.sql` không được chạy trực tiếp**. Thiết kế migration thật phải khớp schema và được kiểm trên database copy sau khi backup.

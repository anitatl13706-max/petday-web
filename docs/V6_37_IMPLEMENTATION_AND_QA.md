# PetDay V6.37 — kiểm toán chức năng, nghiệp vụ và trải nghiệm

## Thay đổi thực sự trong V6.37

1. Quản lý nhân viên: nút **Xóa hồ sơ chưa dùng** chỉ hiện khi nhân viên đã ngừng hoạt động. Server kiểm tra không có tài khoản liên kết, không có ca trực, phân công, nhật ký phân công; nếu có trả HTTP 409. Không tự xóa các ca/lịch sử. Hồ sơ từng hoạt động chỉ nên dùng **Ngừng**.
2. Nhân viên đã được phân công: nút hiển thị **Thay đổi phân công** thay cho "Phân công". API hiện hành vẫn kiểm tra điều kiện ca/chi nhánh.
3. CRM khách hàng: Admin → Nhân viên → **Quản lý khách hàng**: tìm theo tên/email, xem số thú cưng và tổng lịch sử đặt lịch; không được tự sửa tài khoản khách.
4. Kiểm duyệt đánh giá: Admin → Hỗ trợ & ưu đãi → **Kiểm duyệt đánh giá**: duyệt công khai hoặc ẩn với lý do; GET `/api/public/reviews` chỉ trả đánh giá đã duyệt và lịch hoàn tất. Đánh giá mới mặc định chờ duyệt.
5. Hồ sơ thú cưng: thêm mục xem nhanh lịch sử theo từng thú cưng, chỉ lấy lịch từ tài khoản đang đăng nhập. Những lịch này bao gồm cả lịch chưa hoàn tất, do đó tên mục thể hiện lịch sử đặt/chăm sóc, không phải minh chứng đã thực hiện dịch vụ.
6. Không thêm menu chính mới, không thay đổi trạng thái thanh toán hay mô phỏng thu tiền.

## SQL nâng cấp
- Sao lưu database `petday` trong pgAdmin.
- Chỉ sau khi schema bản V6.36 đạt `schemaReady: true`, chạy **duy nhất** `database/021_v637_review_moderation.sql` một lần trong pgAdmin.
- Chạy lại `http://localhost:4000/api/health/schema`. Bản V6.37 yêu cầu `reviews.moderation_status`.
- Những đánh giá cũ được giữ, nhưng mặc định chuyển sang chờ duyệt; Admin phải duyệt nếu muốn đưa công khai.
- Không chạy lại SQL 001–020 đã có. SQL 021 không xóa dữ liệu lịch sử.

## Kiểm thử bắt buộc

| Mã | Vai trò | Các bước | Mong đợi |
|---|---|---|---|
| 37-S01 | Admin | Tạo nhân viên thử, Ngừng, Xóa khi chưa có ca | Xóa được, biến mất khỏi danh sách |
| 37-S02 | Admin | Tạo ca rồi Ngừng, thử Xóa | 409, giữ hồ sơ/ca |
| 37-S03 | Admin | Thử xóa nhân viên đã gắn tài khoản Staff | 409, không xóa tài khoản |
| 37-C01 | Admin | Mở Nhân viên → Quản lý khách hàng, tìm tên/email | Đúng khách; không lộ mật khẩu/token |
| 37-R01 | Customer | Hoàn tất một dịch vụ rồi gửi đánh giá | Tạo đánh giá, chưa công khai trước duyệt |
| 37-R02 | Admin | Mở Hỗ trợ → Kiểm duyệt, duyệt đánh giá | GET /api/public/reviews hiển thị đánh giá đã duyệt |
| 37-R03 | Admin | Ẩn một đánh giá, ghi lý do | Không xuất hiện trên đánh giá công khai |
| 37-P01 | Customer | Xem Thú cưng → lịch sử, reload | Chỉ thấy lịch thuộc thú cưng và tài khoản |
| 37-Q01 | Customer | Đặt Grooming, tiền mặt, không Pet Taxi | Đặt thành công, chưa tự xác nhận đã thu tiền |
| 37-Q02 | Admin | Lịch & điều phối → Nhân viên → Staff chăm sóc | Đúng trạng thái theo từng bước |

## Ma trận yêu cầu của nhóm và các khoảng trống còn lại

Các chức năng có sẵn ở V6.36 (cần E2E): đăng ký, đăng nhập, quên mật khẩu (chỉ khi SMTP thật), sửa hồ sơ, tạo/sửa/xóa Pet Profile có ràng buộc, dịch vụ công khai/tìm kiếm, báo giá động, đặt/xem/đổi/hủy lịch, thanh toán tiền mặt/chuyển khoản thủ công, đánh giá, lịch nhân viên, công suất, ưu đãi, KPI cơ bản, add-on, Pet Taxi, timeline, nhắc lịch trong tài khoản.

Mới bổ sung ở V6.37: xem lịch sử theo thú cưng, tra cứu khách hàng của Admin, kiểm duyệt đánh giá có dữ liệu và quyền thật, xóa hồ sơ nhân viên chưa sử dụng. Các chức năng mới này **chưa được kiểm thử end-to-end trên máy của người dùng**.

**Chưa hoàn chỉnh theo yêu cầu:**
- Admin **CRUD quản lý dịch vụ**: ba gói hiện còn cấu hình trong `server/src/rules.js`, chưa có giao diện quản lý bảng giá/dịch vụ và phê duyệt hiệu lực.
- **Sản phẩm mua kèm** có tồn kho, giỏ hàng, tồn kho giữ chỗ và đơn hàng riêng: chưa được xây dựng trong luồng checkout thực tế. Không được coi add-on dịch vụ là sản phẩm vật lý.
- Gợi ý dịch vụ hiện ở mức quy tắc điều kiện cơ bản; chưa có công cụ quản lý bộ luật ở Admin.
- Nhắc lịch tự động chỉ tạo thông báo trong tài khoản, không tự gửi email/SMS.
- Thanh toán qua ngân hàng cần đối soát thủ công, không có IPN xác minh tự động.
- Quên mật khẩu phải cấu hình SMTP thật trong `server/.env`, xem `/api/health/features`; không lưu mật khẩu trong bản ZIP.

## Kiểm thử công cụ
`cd server && npm test` — các test unit hiện có.
`node --check server/src/server.js` — kiểm tra cú pháp backend.
Frontend build yêu cầu npm dependencies; `npm install && npm run build` trong `PETDAY_OFFICIAL`. Nếu npm install không thành công, không được khẳng định frontend build đạt.

## Phân chia menu đề xuất
**Khách:** Hồ sơ & thú cưng → Dịch vụ/Đặt lịch → Lịch & thanh toán → Hỗ trợ/Thông báo.
**Admin:** Tổng quan → Lịch & điều phối → Nhân viên (kèm khách hàng) → Tài chính → Hỗ trợ & ưu đãi (kèm đánh giá).
**Staff:** Công việc được phân công → Check-in → Chăm sóc → Bàn giao. Không truy cập tài chính/khách ngoài phạm vi.

## Đối chiếu bố cục bên ngoài
MoeGo Help Center: lịch hẹn, hồ sơ khách & pet, nhân viên, thông báo và thanh toán được tổ chức thành nhóm chức năng. Tham khảo https://help.moego.pet/en/ ; không sao chép thương hiệu/giao diện của họ.

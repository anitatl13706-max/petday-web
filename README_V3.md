# PetDay v3 — Giao diện hợp nhất, API PostgreSQL

## Tình trạng được kiểm tra
- Source xuất phát từ PetDay Phase2 v2; đã thay trang demo/API tách rời bằng `src/Portal.tsx`.
- Trang chủ và danh mục dịch vụ giữ bố cục Figma Make.
- Các màn hình Tài khoản, Đặt lịch (4 bước), Lịch hẹn, Quản trị gọi chung API từ `server/src/server.js`.
- Đã kiểm tra cú pháp TypeScript/JSX của các file chỉnh sửa qua TypeScript transpiler.
- **Chưa chạy được npm build hoặc end-to-end với PostgreSQL trong môi trường tạo file.** Phải thử trực tiếp trên máy chạy PostgreSQL của nhóm trước khi công bố hoàn tất.

## Cách nâng cấp từ v2 trên Windows
1. Sao lưu thư mục v2 đang chạy, **không xóa database `petday`**.
2. Giải nén v3, mở đúng thư mục có `package.json`.
3. Sao chép file `server/.env` từ bản v2 vào thư mục `server/` của v3, không gửi file này cho người khác.
4. Terminal backend tại `server/`: `npm install` rồi `npm run dev`. Nếu cổng 4000 đang dùng, dừng backend v2 trước. Không chạy lại SQL 002 trên database đã có dữ liệu.
5. Terminal frontend tại thư mục gốc: `npm install` rồi `npm run dev`. Mở URL Local do Vite thông báo.
6. Đăng nhập bằng tài khoản đã tạo ở v2: dữ liệu vẫn ở PostgreSQL cũ.

## Luồng thử bắt buộc
- Trang chủ → Tài khoản → đăng nhập/đăng ký → tạo Pet Profile (tuổi **năm**, cân nặng **kg**).
- Trang chủ → Đặt lịch → Chọn Pet → Chọn dịch vụ → Chi nhánh/Ngày/Giờ → kiểm tra còn chỗ → Xác nhận.
- Lịch hẹn của tôi → xem mã, trạng thái, giá, hủy khi Pending.
- Admin → Xác nhận → Đang thực hiện → Hoàn tất → tạo nhật ký chăm sóc → khách gửi đánh giá.
- Trường hợp lỗi: tài khoản Customer vào `#quan-tri` phải bị từ chối; mèo không được đặt Daycare; ngày quá khứ không hợp lệ; slot hết chỗ; đánh giá trùng bị chặn.

## Tạo quyền quản trị để thử (không thực hiện trên tài khoản khách đang sử dụng)
- Đăng ký riêng một tài khoản kiểm thử admin qua giao diện, ví dụ `admin@example.test`.
- Dùng pgAdmin Query Tool của **petday** chạy thủ công:
  `UPDATE users SET role='admin' WHERE email='admin@example.test';`
- Đăng xuất và đăng nhập lại tài khoản này để JWT cập nhật quyền. Mở Tài khoản → Quản trị.
- Không công khai thông tin đăng nhập trong source hoặc báo cáo.

## Phạm vi đã kết nối / chưa có
- Đã có mã nguồn cho account, pets, booking, status, care notes, reviews qua PostgreSQL.
- Chưa có: thanh toán trực tuyến thật, Pet Taxi thật, add-on/giỏ sản phẩm có giá backend, hoàn tiền, đổi lịch, đặt lại mật khẩu, dịch vụ CRUD, staff role đầy đủ.
- Giá hiển thị ở bước xác nhận chỉ là **tạm tính** và được tính lại tại server.
- Phần hình ảnh, chứng thực khách hàng, hotline/địa chỉ trên trang chủ từ bản mockup là nội dung mẫu cần thay bằng dữ liệu được xác thực trước khi công bố công khai.
- Đây là bản ứng dụng dành cho đồ án và trình diễn có PostgreSQL, **chưa phải hệ thống thương mại sẵn sàng triển khai cho khách hàng thật**.

# PetDay V6.97 — hướng dẫn đồng bộ localhost → website online

## Những thay đổi trong bản này

- Giữ nguyên 6 nhóm, 90 tên sản phẩm và toàn bộ ảnh WebP trong `public/shop`. Không thay sản phẩm hoặc bảng dữ liệu.
- Bỏ quy tắc Git LFS đối với hình ảnh (`.webp`, `.jpg`, `.png`…), để ảnh được đưa trực tiếp vào Git và bản build Vercel. Nếu repo trước đây đã lưu các tệp này dưới dạng LFS pointer, cần thêm lại các tệp ảnh như bên dưới.
- `src/apiFetch.ts`: hỗ trợ `VITE_API_ORIGIN` khi frontend chạy trên Vercel, thay cho Vite proxy chỉ dùng khi chạy local. Các endpoint `/api/...` được gửi đến backend thực tế khi có cấu hình; ảnh được người dùng tải lên theo `/uploads/...` cũng được trỏ về backend.
- Mở lại khối **Thiết lập nhận chuyển khoản** trong tab **Tài chính** dành cho Admin (`src/Portal.tsx`). Chức năng này vẫn đòi hỏi Admin hợp lệ và `PETDAY_DEMO_PAYMENT=false`.
- Thêm kiểm tra `node scripts/check-shop-assets.mjs` để ngăn phát hành bản thiếu ảnh.

## 1. Hai phần bắt buộc cần triển khai

**Frontend (Vercel)**: deploy từ thư mục `PETDAY_OFFICIAL`, framework Vite, build command `npm run build`, output directory `dist`. Có thể kiểm tra ảnh bằng URL `https://TEN-MIEN/shop/categories/thuc-an-dinh-duong.webp`. Phải trả về ảnh thật (Content-Type `image/webp`), không phải trang HTML/404.

**Backend (máy chủ Node.js hoạt động liên tục)**: deploy từ `PETDAY_OFFICIAL/server`; start command `npm start`; server lắng nghe `process.env.PORT`. Không thể chỉ deploy thư mục frontend và mong `/api` tự chạy như ở localhost. Backend phải có PostgreSQL truy cập được qua `DATABASE_URL` và schema phù hợp. Không public địa chỉ DB hoặc secrets.

Ví dụ các biến cấu hình (**thay ví dụ bằng URL thật**):

- Vercel / Frontend: `VITE_API_ORIGIN=https://TEN-BACKEND-THAT.example` (không có `/api` ở cuối). Phải **redeploy frontend** sau khi thêm biến.
- Backend: `DATABASE_URL=<chuỗi kết nối database online>`, `JWT_SECRET=<bí mật đủ dài>`, `FRONTEND_ORIGIN=https://petday-web.vercel.app`, `PETDAY_DEMO_PAYMENT=false`, `PORT=<cổng do nhà cung cấp cấp>`.
- Nếu thay đổi địa chỉ frontend, thêm đúng origin mới vào `FRONTEND_ORIGIN` bằng dấu phẩy. Backend cho phép CORS theo danh sách này.

**Quan trọng:** Database local `petday` trên máy không tự xuất hiện ở database online. Phải chuẩn bị DB online với schema/migration đúng phiên bản và chỉ sao lưu/chuyển dữ liệu khi đã xác nhận cần thiết. Quyền Admin trên local không đồng nghĩa quyền Admin online. Không chạy lại tất cả SQL hoặc xóa DB đang dùng.

## 2. Khôi phục ảnh khi Git từng dùng LFS

Trong thư mục `PETDAY_OFFICIAL` của bản sửa, trước khi commit:

```powershell
node .\scripts\check-shop-assets.mjs
git add --renormalize public/shop public/services
git add .gitattributes src scripts HUONG_DAN_DUA_PETDAY_LEN_ONLINE.md
git status
```

Nếu repo vẫn báo một số ảnh được theo dõi bởi LFS, sau khi kiểm tra quy tắc `.gitattributes` hãy thực hiện `git rm --cached -r public/shop public/services`, rồi `git add public/shop public/services` (thao tác chỉ với Git index, **không xóa ảnh trên máy**). Tránh lệnh `git lfs migrate` trên lịch sử dùng chung nếu chưa có kế hoạch riêng.

## 3. Kích hoạt chuyển khoản đúng cách

Đăng nhập tài khoản **đã có quyền Admin trong database của backend online**, vào **Tài khoản → Mở trang quản trị → Tài chính → Thiết lập nhận chuyển khoản**. Điền thông tin tài khoản thuộc quyền quản lý hợp pháp và nhấn lưu. Backend trả `/api/payment/options` với `bankTransfer.enabled=true` sau khi cấu hình hợp lệ. Đừng xác nhận đã nhận tiền nếu chưa đối soát thực tế.

Nếu vẫn thấy `Chưa kích hoạt`, kiểm tra kết quả `/api/payment/options` **trên backend online**, sau đó kiểm tra schema bảng `business_payment_settings` và cấu hình `PETDAY_DEMO_PAYMENT`. Không sử dụng ngân hàng giả hoặc dữ liệu giả để mở nhận chuyển khoản.

## 4. Ảnh upload của khách không giống ảnh sản phẩm

Ảnh sản phẩm đã ở `public/shop`, nên có thể phục vụ tĩnh từ Vercel. Ảnh thú cưng/nhật ký được upload vào `server/uploads` trong backend. Với dịch vụ cloud không có ổ đĩa bền vững, các ảnh upload này **có thể mất sau khi khởi động/triển khai lại**. Muốn đảm bảo bền vững phải dùng persistent volume hoặc object storage và điều chỉnh upload API theo hạ tầng. Bản sửa này **chưa di chuyển ảnh upload sang object storage**.

## 5. Kiểm thử trước khi công bố

1. Chạy `node scripts/check-shop-assets.mjs`: 6 danh mục, 90 sản phẩm, 96 ảnh, 0 lỗi.
2. Trên Vercel, mở trực tiếp một ảnh danh mục và một ảnh sản phẩm; phải hiển thị WebP, không phải 404/LFS pointer.
3. Trên backend online, kiểm tra `/api/health` hoặc endpoint health thích hợp và `/api/payment/options`; kết quả phải là JSON.
4. Đăng nhập bằng **tài khoản Admin thuộc database online**, mở tab Tài chính và Cửa hàng.
5. Kiểm tra xem danh sách 90 sản phẩm thực sự có trong database online, số lượng tồn kho đúng, đặt hàng tiền mặt thử; chỉ thử chuyển khoản khi có tài khoản hợp lệ và kiểm soát được dữ liệu.
6. Kiểm tra CORS giữa domain frontend và backend, kiểm tra quy trình dịch vụ, mua hàng, admin, chatbot và ảnh upload trên môi trường thử nghiệm.

## Giới hạn xác minh hiện tại

Bản ZIP mã nguồn không chứa thông tin máy chủ backend online, connection string DB online, cấu hình Vercel hiện tại hoặc lịch sử Git đang triển khai. Vì vậy không thể khẳng định website đang mở đã được đồng bộ; cần triển khai phiên bản sửa, cấu hình các môi trường tương ứng và kiểm thử thực tế. Không có dữ liệu khách hàng hoặc mật khẩu trong gói sửa mới.

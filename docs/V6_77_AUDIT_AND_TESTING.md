# PetDay V6_77 – Kiểm tra hồi quy và hướng dẫn nghiệm thu

**Nguồn:** V6_76. **Không xóa lịch, pet, sản phẩm hoặc đơn mua hàng.** Đây là bản sửa lỗi và bổ sung kiểm tra, **không phải chứng nhận E2E đã hoàn tất**.

## Những lỗi đã sửa

- Chặn đặt lịch, báo giá và áp mã ưu đãi bằng **hồ sơ thú cưng đã lưu trữ** ở Backend. Không chỉ ẩn khỏi giao diện.
- Ngăn sửa hồ sơ thú cưng đã lưu trữ.
- Sửa điều kiện phân quyền đối với tài khoản staff cũ: xem/chăm sóc lịch phải khớp `staff_members.user_id` với tài khoản đăng nhập. **Bản demo chỉ cần Admin; bốn tên nhân viên là hồ sơ phân công.**
- Chỉnh thông báo xóa hồ sơ có lịch sử: gợi ý chọn *Lưu trữ*.
- Bổ sung chẩn đoán schema cho `pets.archived_at`, phân biệt với cột `is_archived` từng được tạo nhầm.

## Quan trọng – lỗi 503 /pets

Source V6_76/V6_77 sử dụng `pets.archived_at` (*timestamp*), **không** dùng `pets.is_archived`. Vì vậy nếu database chỉ có `is_archived`, website vẫn có thể trả 503.

1. Sao lưu database TEST trước.
2. Chạy `npm run db:doctor` từ `PETDAY_OFFICIAL/server` sau khi copy `server/.env`.
3. Nếu thiếu `archived_at`, dùng file `database/040_v676_pet_archive.sql` sau khi kiểm tra cấu trúc và backup. Đừng chạy lại toàn bộ migration.
4. Khởi động lại backend và test API `/api/pets` bằng tài khoản customer.

## Lưu ý về cấu hình cổng

Frontend 8443, backend 4000. Mở `START_PETDAY_V677.ps1` từ thư mục ngoài cùng để kiểm tra thư mục và cổng trước khi chạy. Script **không tự tắt** các tiến trình đang chạy.

## Kết quả kiểm thử trong môi trường tạo source

- Backend unit tests: chạy `npm test`; có thêm các phép kiểm tra hồi quy không cho archived pet đặt lịch và giới hạn Staff đúng phân công.
- Kiểm tra cú pháp JS server và TSX (không đồng nghĩa đã build giao diện).
- **Chưa có PostgreSQL TEST và trình duyệt đang đăng nhập của người dùng**. Vì vậy chưa thể chấm Đạt E2E các TC-01–TC-40. Trạng thái toàn bộ các trường hợp E2E là **CHƯA XÁC NHẬN**.

## 40 trường hợp cần chạy trên máy

| ID | Hành động | Kỳ vọng |
|---|---|---|
| TC-01 | Đăng ký/đăng nhập | Vào tài khoản thành công |
| TC-02 | Sai mật khẩu | Báo lỗi |
| TC-03 | Tạo/sửa pet | Dữ liệu lưu chính xác |
| TC-04 | Xóa pet chưa có lịch | Xóa được |
| TC-05 | Lưu trữ pet có lịch hoàn tất | Ẩn pet nhưng giữ lịch sử |
| TC-06 | Lưu trữ pet còn lịch đang hoạt động | Từ chối |
| TC-07 | Grooming chó/mèo | Giá đúng |
| TC-08 | Daycare chó 0.5 tuổi | Từ chối |
| TC-09 | Daycare chó đủ 1 tuổi | Chấp nhận nếu đủ điều kiện |
| TC-10 | Daycare mèo | Từ chối |
| TC-11 | Hai lịch trùng giờ cùng pet | Từ chối |
| TC-12 | Add-on, mua kèm | Tổng đúng |
| TC-13 | Admin duyệt lịch | Đã xác nhận |
| TC-14 | Phân công nhân viên | Không trùng giờ |
| TC-15 | Đổi phân công | Lưu sau reload |
| TC-16 | Ngừng/sửa nhân viên | Giữ lịch sử |
| TC-17 | Đặt Taxi | Lưu đủ thông tin/phí |
| TC-18 | Taxi chưa duyệt lịch | Chặn bàn giao |
| TC-19 | Taxi đã bàn giao | Ẩn Khách không đến |
| TC-20 | Bắt đầu dịch vụ | Đang thực hiện |
| TC-21 | Hoàn tất dịch vụ | Hoàn tất một lần |
| TC-22 | Thanh toán trước | Không tự đổi trạng thái chăm sóc |
| TC-23 | Hủy lịch đang chờ | Đã hủy |
| TC-24 | Khách xin hủy lịch đã duyệt | Admin nhận yêu cầu |
| TC-25 | Admin chấp thuận hủy | Đã hủy |
| TC-26 | Admin từ chối hủy | Lịch giữ nguyên, khách thấy lý do |
| TC-27 | Khách không đến sau duyệt | Cho đóng kèm lý do |
| TC-28 | No-show sau taxi bàn giao | Từ chối |
| TC-29 | 6 danh mục, ảnh | Đúng tên/hình |
| TC-30 | Lọc/tìm kiếm/sắp xếp | Đúng kết quả |
| TC-31 | Thêm nhiều sản phẩm | Tổng và số lượng đúng |
| TC-32 | Số lượng vượt kho | Không cho tạo đơn |
| TC-33 | Nhận tại cửa hàng | Không có phí giao hàng |
| TC-34 | Giao tận nhà | Lưu địa chỉ/phí |
| TC-35 | Thiếu dữ liệu nhận hàng | Hiện lỗi rõ |
| TC-36 | Gửi đơn hợp lệ | Chỉ tạo một đơn |
| TC-37 | Admin xác nhận đơn | Đúng trạng thái |
| TC-38 | Giao tận nhà | Chuẩn bị → giao → hoàn tất |
| TC-39 | Nhận tại quầy | Sẵn sàng → đã bàn giao |
| TC-40 | Ghi nhận thanh toán | Không tự đổi trạng thái phục vụ/giao |

**Ghi nhận lỗi:** chụp màn hình, ghi trạng thái trước/sau, xem Terminal Backend và thông báo HTTP; không tự chạy lại SQL hàng loạt.

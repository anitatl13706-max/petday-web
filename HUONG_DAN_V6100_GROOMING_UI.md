# PetDay V6.100 — Grooming và giao diện điều kiện sử dụng

- Cho phép **Grooming tạo kiểu** với cả chó và mèo ở danh mục dịch vụ frontend và bộ kiểm tra/định giá backend. Giữ mã gói, đơn giá cơ bản và công suất cũ.
- Với chó: tư vấn tạo kiểu theo giống, dáng lông. Với mèo: tỉa vệ sinh, gọn lông nhẹ khi tình trạng và mức độ hợp tác phù hợp; không cam kết cạo sát/tạo kiểu không an toàn.
- Thiết kế lại thẻ Điều kiện sử dụng: tiêu đề gọn, nhãn trạng thái, ba ô thông tin loài/cân nặng/hồ sơ, thông báo phù hợp/không phù hợp và lưu ý Grooming riêng.
- Sửa mô tả giới thiệu ở trang chủ và quyền lợi gói.
- Không cần migration SQL mới cho hai thay đổi này.
- V6.99 có QR 15 phút cần migration 048/049 tại database riêng trước khi dùng tính năng QR.
- Giữ nguyên .env local của người dùng ở máy; file ZIP không chứa thông tin bí mật.

## Kiểm thử gợi ý
1. Chọn hồ sơ mèo <=40 kg, gói Grooming tạo kiểu: thẻ báo đủ điều kiện cơ bản, qua bước báo giá và tạo lịch hợp lệ.
2. Chọn chó <=40 kg: lựa chọn cũ vẫn hoạt động.
3. Cân nặng >40 kg: báo không phù hợp và backend từ chối tạo lịch.
4. Chọn Daycare cho mèo dưới 1 tuổi: báo không đủ điều kiện.
5. Thử giao diện ở màn hình điện thoại, ba ô thu về một cột.
6. Xác nhận tên dịch vụ và đơn giá vẫn khớp backend trước khi thanh toán.

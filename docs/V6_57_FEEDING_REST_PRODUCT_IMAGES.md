# PetDay V6.57 – Dụng cụ ăn uống & Nghỉ ngơi

- Đã tích hợp 15 hình sản phẩm minh họa (AI, phong cách chụp thực tế) riêng từng mặt hàng.
- Lưu ảnh local: `public/shop/products/<ten-san-pham>.webp`.
- Ảnh danh mục: `public/shop/categories/dung-cu-an-uong-nghi-ngoi.webp`.
- Hình ảnh không phải ảnh SKU thương hiệu chính hãng. Ảnh được cắt từ bảng ảnh minh họa và có thể có độ phân giải hạn chế.
- Đã sửa phân loại frontend để hộp đựng thức ăn, bát ăn, máy cho ăn luôn vào nhóm dụng cụ thay vì Thức ăn & Dinh dưỡng.
- Chức năng backend, đặt lịch, thanh toán và đơn hàng được giữ nguyên.
- Không cần SQL để thay ảnh. SQL 036 chỉ bổ sung 15 tên sản phẩm mẫu chưa tồn tại trên PostgreSQL TEST, cần backup và migration 032 trước.
- Dữ liệu cũ có thể khiến số sản phẩm hiển thị trong nhóm lớn hơn 15. Không xóa sản phẩm cũ tự động.

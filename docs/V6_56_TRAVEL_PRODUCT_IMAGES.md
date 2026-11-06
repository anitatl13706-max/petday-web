# PetDay V6.56 — Đi dạo & Di chuyển

- Đã gắn 15 ảnh mặt hàng dưới `public/shop/products` theo tên chuẩn tiếng Việt.
- Ảnh đại diện danh mục nằm tại `public/shop/categories/di-dao-di-chuyen.webp`.
- Thay ảnh cả các tên cũ tương đương bằng bản chụp của đúng loại vật dụng.
- Không chỉnh sửa backend, logic giỏ hàng, đặt lịch, chuyển khoản hoặc dữ liệu đã tạo.
- Ảnh là minh họa sản phẩm tạo bằng AI, không phải ảnh SKU/hãng chính thức.
- Chỉ cần giải nén source, sao chép `server/.env`, chạy frontend/backend và refresh trình duyệt để thấy ảnh mới.
- Migration 035 chỉ tùy chọn bổ sung tên sản phẩm chưa có trên PostgreSQL TEST (sau khi backup). Nếu chưa có danh mục 6 nhóm thì chạy migration 032 trước.
- Vì dữ liệu cũ được giữ lại, số sản phẩm thuộc một nhóm có thể nhiều hơn 15.

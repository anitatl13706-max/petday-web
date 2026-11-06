# PetDay V6.55 — Hình Vệ sinh & Răng miệng; Đồ chơi & Vận động

- Từ V6.54, đã cập nhật ảnh cover cho hai danh mục trong `public/shop/categories`.
- Tạo 15 ảnh riêng theo tên cho mỗi danh mục từ những bức ảnh sản phẩm minh họa AI đã sinh. Các biến thể cùng loại có thể chia sẻ cùng hình đồ vật.
- Bổ sung/thay ảnh cho những sản phẩm cũ có tên tương ứng nằm trong các SQL seed trước.
- Giữ nguyên frontend shopping logic, backend, booking, order, payments and delivery.
- Không bắt buộc chạy migration để thay ảnh. Chỉ chạy SQL 034 (tùy chọn) trên PostgreSQL TEST đã sao lưu nếu muốn bổ sung tên sản phẩm còn thiếu.
- Ảnh minh họa AI, không phải ảnh thật được kiểm chứng của nhà sản xuất hay nhãn hàng chính thức.

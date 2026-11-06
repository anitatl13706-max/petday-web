# PetDay V6.51 – ảnh danh mục Cửa hàng

Đã chèn 4 ảnh danh mục trong `public/shop/categories/`:
- thuc-an.webp – gói hạt, pate, snack và bát thức ăn
- cham-soc.webp – dầu tắm, lược, kìm cắt móng và chăm sóc lông
- ve-sinh.webp – cát vệ sinh, tấm lót, khăn ướt và dụng cụ vệ sinh
- phu-kien.webp – túi vận chuyển, dây dắt, bát ăn và đệm ngủ

Đã sửa `src/BusinessExpansion.tsx` để mỗi thẻ danh mục có ảnh riêng, nhãn đếm sản phẩm, trạng thái được chọn và đường dẫn ảnh cục bộ. Không cần migration/SQL để dùng ảnh mới. Backend và tính năng thanh toán giữ nguyên từ V6_50.

**Lưu ý:** Đây là ảnh minh họa **danh mục**, không phải ảnh SKU riêng của toàn bộ sản phẩm; các ảnh sản phẩm cũ vẫn chưa được thay trong bản này.

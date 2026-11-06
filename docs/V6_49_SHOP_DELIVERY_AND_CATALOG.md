# PetDay V6.49 – Shop delivery + full catalog

## Mục tiêu đã triển khai
1. **Decor lại trang Cửa hàng**
   - thẻ sản phẩm hiển thị trực quan hơn
   - phân nhóm rõ: Thức ăn / Chăm sóc / Vệ sinh / Phụ kiện
   - hỗ trợ phân trang, tìm kiếm, sắp xếp
2. **Thêm luồng mua hàng giao tận nhà**
   - chọn `Nhận tại cửa hàng` hoặc `Giao tận nhà`
   - với giao tận nhà: nhập người nhận, số điện thoại, khu vực, địa chỉ, ghi chú
   - phí ship ước tính theo khu vực:
     - `inner_hcm`: 25.000đ
     - `outer_hcm`: 40.000đ
3. **Bổ sung catalog phong phú hơn**
   - file SQL mới seed thêm sản phẩm để mỗi nhóm có khoảng 10 sản phẩm trở lên

## File code đã sửa
- `src/BusinessExpansion.tsx`
- `server/src/server.js`
- `database/030_v649_retail_delivery_and_full_catalog.sql`

## Cách chạy cho bản TEST
### Bước 1 – Chạy SQL mới
Chạy file:
- `database/030_v649_retail_delivery_and_full_catalog.sql`

> Nên chạy trên môi trường TEST sau khi sao lưu.

### Bước 2 – Chạy app
Frontend:
```bash
npm install
npm run dev
```

Server:
```bash
cd server
npm install
npm run dev
```

## Nếu thầy hỏi “khách muốn mua hàng giao tận nhà thì sao?”
Có thể trả lời:

> PetDay hỗ trợ 2 hình thức mua sản phẩm độc lập: nhận tại chi nhánh và giao tận nhà. Nếu khách chọn giao tận nhà, hệ thống yêu cầu nhập người nhận, số điện thoại, khu vực giao hàng, địa chỉ chi tiết và ghi chú. Phí ship được ước tính theo khu vực, cộng vào tổng tiền, sau đó nhân viên xác nhận lại trước khi xử lý đơn.

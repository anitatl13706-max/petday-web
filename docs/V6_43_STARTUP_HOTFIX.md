# PetDay V6.43 - Startup hotfix

## Lỗi đã sửa

`TypeError: retailSelectionSchema.min is not a function` tại `server/src/server.js:454`.

Nguyên nhân: `retailSelectionSchema` là ZodDefault (`.default([])`), không phải ZodArray, nên không gọi trực tiếp `.min(1)`.

Cách sửa: tách `retailItemsArraySchema` là ZodArray, sử dụng `.default([])` cho phần mua kèm tùy chọn; sử dụng `.min(1)` trên ZodArray cho đơn mua riêng.

## Khi thay bản hotfix

- Chỉ thay source V6.43. Không chạy lại SQL.
- Sao chép `server/.env` từ thư mục V6.43 cũ sang `server/.env` mới, không đưa file bí mật này cho người khác.
- Terminal backend: `npm install`, `npm test`, `npm run dev`; trang `http://localhost:4000/api/health`.
- Terminal frontend: `npm install`, `npm run build`, `npm run dev`; website `http://localhost:8443`.
- `npm test` không thay thế kiểm thử quá trình khởi động server và tích hợp PostgreSQL.

## Kiểm thử quan trọng

- Đơn mua sản phẩm riêng yêu cầu ít nhất 1 sản phẩm, tối đa 3 sản phẩm khác nhau.
- Đơn đặt lịch chăm sóc không mua kèm vẫn cho `retail: []` hoặc bỏ qua nhờ mặc định.
- Không sử dụng `npm audit fix --force` khi chưa đánh giá ảnh hưởng phiên bản.

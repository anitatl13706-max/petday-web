# PetDay V6.43 – Stable Boot & QA

Nâng cấp dựa trên toàn bộ source V6.42. Có cơ chế báo lỗi trang trắng và trang `/#kiem-tra-he-thong` để chẩn đoán API/PostgreSQL/SMTP/thanh toán.

- Không tạo database mới, không chạy lại migration 001–025.
- Mọi tính năng kinh doanh cũ được giữ nguyên; các luồng chưa đủ điều kiện (SMTP, bank transfer chưa cấu hình, CRUD gói mới, giao hàng tận nhà) vẫn cần triển khai hoặc cấu hình riêng.
- Đọc `docs/V6_43_STATUS_AND_QA.md` trước khi test.

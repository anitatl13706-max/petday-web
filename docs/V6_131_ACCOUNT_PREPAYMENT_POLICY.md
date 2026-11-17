# Chính sách trả trước theo tài khoản khách hàng

Migration `database/066_v6131_customer_prepayment_policy.sql` bổ sung audit nguồn hủy lịch. Migration không thay đổi trạng thái, tổng tiền, phương án thanh toán hoặc biên nhận của lịch cũ.

Backend quyết định bắt buộc trả trước theo `customer_id`:

- Chưa có lịch trạng thái `Hoàn tất`: bắt buộc trả trước.
- Hai kết quả kết thúc gần nhất đều là khách chủ động hủy: bắt buộc trả trước.
- No-show, PetDay hủy hoặc hệ thống đóng lịch không được tính là khách chủ động hủy và làm gián đoạn chuỗi hủy.
- `pet_id` không tham gia quyết định; lịch hoàn tất của một pet áp dụng cho mọi pet thuộc cùng tài khoản.

API `GET /api/me/prepayment-policy` luôn trả dữ liệu mới với `Cache-Control: no-store`. API báo giá và API tạo lịch đều tính lại chính sách ở backend; frontend chỉ hiển thị kết quả.

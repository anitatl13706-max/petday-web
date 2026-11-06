# V6_89 — Chẩn đoán HTTP 409 khi duyệt hủy

V6_89 cho phép duyệt yêu cầu hủy còn pending nếu lịch đã trở về trạng thái `Đang chờ xác nhận`, miễn chưa có nhật ký chăm sóc. Nếu lịch đã hủy/đang thực hiện/hoàn tất, API trả lỗi cụ thể hơn; không tự đảo trạng thái hoặc hoàn tiền.

Chạy trên PostgreSQL TEST (chỉ đọc):

```sql
SELECT r.id AS request_id, r.status AS request_status, r.reason,
       b.code, b.status AS booking_status, b.payment_status,
       (SELECT count(*) FROM service_events e WHERE e.booking_id=b.id) AS care_events,
       (SELECT count(*) FROM pet_taxi_requests t WHERE t.booking_id=b.id) AS taxi_requests
FROM booking_cancellation_requests r
JOIN bookings b ON b.id=r.booking_id
WHERE b.code='PD-29C2866FD4'
ORDER BY r.id DESC;
```

Nếu `booking_status = Đã hủy` mà request còn `pending`, cần đối chiếu vì lịch có thể đã được Admin hủy hoặc đánh dấu khách không đến; không tự tạo thêm khoản hoàn.

Không có migration mới cho bản sửa này.

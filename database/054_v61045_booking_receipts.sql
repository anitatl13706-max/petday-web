-- PetDay V6.104.5: auditable actual receipts (cash or bank transfer).
-- Run ONCE on a backed-up LOCAL PostgreSQL petday database after 053.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_payment_receipts (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES bookings(id),
 amount BIGINT NOT NULL CHECK(amount>0),
 method VARCHAR(30) NOT NULL CHECK(method IN ('cash','bank_transfer')),
 reference VARCHAR(120),
 note TEXT,
 recorded_by BIGINT REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS booking_payment_receipts_reference_uniq ON booking_payment_receipts(reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_payment_receipts_booking_idx ON booking_payment_receipts(booking_id);
-- Old fully paid bookings had no separate receipts: backfill exactly once.
INSERT INTO booking_payment_receipts(booking_id,amount,method,reference,note)
SELECT b.id,b.total,b.payment_method,NULL,'Số đã thu chuyển tiếp từ lịch sử xác nhận thanh toán trước V6.104.5'
FROM bookings b
WHERE b.payment_status='Đã thanh toán' AND b.total>0
AND NOT EXISTS(SELECT 1 FROM booking_payment_receipts x WHERE x.booking_id=b.id);
COMMIT;

-- PetDay V6.28: idempotent additive schema; back up the database first.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_cancellation_requests (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
 customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 800),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 admin_note TEXT,
 resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 resolved_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_petday_cancellation_one_pending
 ON booking_cancellation_requests(booking_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_petday_cancellation_status_time
 ON booking_cancellation_requests(status,created_at DESC);
COMMIT;

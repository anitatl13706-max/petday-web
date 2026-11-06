-- PetDay V6.50 — hỗ trợ luồng chuyển khoản THỦ CÔNG cho lịch dịch vụ.
-- Chạy trên PostgreSQL TEST sau khi sao lưu. Cần users + bookings từ các migration nền tảng.
-- Không tự nhận tiền, không tự thay đổi payment_status của bất kỳ lịch hẹn nào.
BEGIN;
CREATE TABLE IF NOT EXISTS public.business_payment_settings (
 id SMALLINT PRIMARY KEY CHECK(id=1),
 bank_name VARCHAR(100) NOT NULL,
 account_number VARCHAR(25) NOT NULL CHECK(account_number ~ '^[0-9]{6,25}$'),
 account_holder VARCHAR(120) NOT NULL,
 updated_by BIGINT REFERENCES public.users(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.bank_transfer_notices (
 booking_id BIGINT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE RESTRICT,
 customer_reference TEXT CHECK (char_length(customer_reference)<=100),
 customer_note TEXT CHECK (char_length(customer_note)<=300),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_petday_transfer_notices_updated ON public.bank_transfer_notices(updated_at DESC);
CREATE TABLE IF NOT EXISTS public.payment_events (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 admin_id BIGINT NOT NULL REFERENCES public.users(id),
 previous_status TEXT NOT NULL,
 new_status TEXT NOT NULL,
 reference TEXT,
 note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_booking ON public.payment_events(booking_id,created_at DESC);
COMMIT;

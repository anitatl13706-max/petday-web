-- PetDay V6.40: customer transfer notices (NOT payment confirmation).
-- Apply ONLY after backing up petday and after SQL 022. Never rerun foundation scripts.
BEGIN;
CREATE TABLE IF NOT EXISTS public.bank_transfer_notices (
 booking_id BIGINT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE RESTRICT,
 customer_reference TEXT CHECK (char_length(customer_reference) <= 100),
 customer_note TEXT CHECK (char_length(customer_note) <= 300),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_petday_transfer_notices_updated ON public.bank_transfer_notices(updated_at DESC);
COMMIT;

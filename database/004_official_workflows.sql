-- PetDay: additive migration only; run once against existing petday after backup.
BEGIN;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_method_check CHECK(payment_method IN ('cash','bank_transfer'));
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK(payment_status IN ('Chưa thanh toán','Đã thanh toán','Thanh toán mô phỏng thành công','Thanh toán thất bại (mô phỏng)','Đã hoàn tiền (mô phỏng)'));
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS public.password_reset_tokens(
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON public.password_reset_tokens(user_id,expires_at);
COMMIT;

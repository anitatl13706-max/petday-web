-- PetDay V6.114 | Apply only to TEST database after 059.
-- Remember the amount displayed in each QR session; server uses exactly this amount.
BEGIN;
ALTER TABLE public.payment_qr_sessions ADD COLUMN IF NOT EXISTS requested_amount bigint;
ALTER TABLE public.payment_qr_sessions DROP CONSTRAINT IF EXISTS payment_qr_requested_amount_positive;
ALTER TABLE public.payment_qr_sessions ADD CONSTRAINT payment_qr_requested_amount_positive
  CHECK (requested_amount IS NULL OR requested_amount > 0);
COMMIT;

-- V6.117: preserve the original payment plan and distinguish deposit vs full prepayment.
-- Apply once on backed-up PetDay TEST database, after 061.
-- Historical receipts have unknown purpose, left NULL; never relabel all bank receipts as deposits.
BEGIN;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(24);
ALTER TABLE public.booking_payment_receipts
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(24);
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_plan_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_plan_check
  CHECK (payment_plan IS NULL OR payment_plan IN ('DEPOSIT_20','FULL_PREPAY','PAY_LATER'));
ALTER TABLE public.booking_payment_receipts DROP CONSTRAINT IF EXISTS booking_receipt_purpose_check;
ALTER TABLE public.booking_payment_receipts ADD CONSTRAINT booking_receipt_purpose_check
  CHECK (purpose IS NULL OR purpose IN ('DEPOSIT','BALANCE','FULL_PAYMENT'));
COMMIT;

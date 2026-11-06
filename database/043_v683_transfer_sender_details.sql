-- V6.83: sender information for manual payment reconciliation; safe for existing rows.
BEGIN;
ALTER TABLE public.bank_transfer_notices ADD COLUMN IF NOT EXISTS sender_bank TEXT;
ALTER TABLE public.bank_transfer_notices ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.retail_transfer_notices ADD COLUMN IF NOT EXISTS sender_bank TEXT;
ALTER TABLE public.retail_transfer_notices ADD COLUMN IF NOT EXISTS sender_name TEXT;
COMMIT;

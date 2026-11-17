-- V6.111: Notes supplied below payment method on service and shop checkouts.
-- Run once against the TEST database before starting backend V6.111.
BEGIN;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS customer_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_note_length;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_note_length CHECK (length(customer_note) <= 500);
ALTER TABLE public.retail_orders DROP CONSTRAINT IF EXISTS retail_orders_customer_note_length;
ALTER TABLE public.retail_orders ADD CONSTRAINT retail_orders_customer_note_length CHECK (length(customer_note) <= 500);
COMMIT;

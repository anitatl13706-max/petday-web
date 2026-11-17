-- V6.128 - idempotent automatic booking closure audit.
-- Backup your TEST database before applying. Requires booking & notification schemas.
BEGIN;
-- NULL recorded_by represents an automated system action; human actions still keep user IDs.
ALTER TABLE public.booking_no_shows ALTER COLUMN recorded_by DROP NOT NULL;
CREATE TABLE IF NOT EXISTS public.booking_auto_close_events (
 booking_id BIGINT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE RESTRICT,
 previous_status TEXT NOT NULL,
 new_status TEXT NOT NULL,
 reason TEXT NOT NULL,
 processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_auto_close_processed ON public.booking_auto_close_events(processed_at DESC);
COMMIT;

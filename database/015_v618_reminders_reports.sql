-- PetDay V6.18: scheduled in-app reminders and care photo metadata.
-- Back up database petday; prerequisites migrations 001 through 014.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.service_events') IS NULL OR to_regclass('public.bookings') IS NULL OR to_regclass('public.users') IS NULL THEN
  RAISE EXCEPTION 'Missing prerequisite migration. Apply prior SQL files first.';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.booking_reminders (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN ('day_before')),
 sent_by BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT uq_booking_reminder UNIQUE(booking_id,kind)
);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent_at ON public.booking_reminders(sent_at DESC);
ALTER TABLE public.service_events ADD COLUMN IF NOT EXISTS photo_url TEXT;
COMMIT;

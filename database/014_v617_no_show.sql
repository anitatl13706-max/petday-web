-- PetDay V6.17 - exceptional visits, without changing historical bookings
-- Prerequisite: migrations through 013. Backup first. Run against database petday.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.bookings') IS NULL OR to_regclass('public.service_events') IS NULL OR to_regclass('public.users') IS NULL THEN
  RAISE EXCEPTION 'Missing prerequisite tables. Stop and check migrations 001-013.';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.booking_no_shows (
 booking_id BIGINT PRIMARY KEY REFERENCES public.bookings(id) ON DELETE RESTRICT,
 recorded_by BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 reason TEXT NOT NULL CHECK(length(btrim(reason)) BETWEEN 8 AND 500),
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_no_shows_time ON public.booking_no_shows(recorded_at DESC);
COMMIT;

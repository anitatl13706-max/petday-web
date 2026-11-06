-- PETDAY V6.14 - Additive, preserve all customers and bookings.
-- PREREQUISITE: apply prior migrations through 010. BACK UP 'petday' FIRST.
BEGIN;
CREATE TABLE IF NOT EXISTS public.service_events (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
 event_type TEXT NOT NULL CHECK (event_type IN ('check_in','care_update','ready','check_out')),
 note TEXT NOT NULL CHECK (char_length(btrim(note)) BETWEEN 3 AND 1200),
 created_by BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_events_booking_id ON public.service_events (booking_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_milestone_check_in ON public.service_events(booking_id) WHERE event_type='check_in';
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_milestone_ready ON public.service_events(booking_id) WHERE event_type='ready';
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_milestone_check_out ON public.service_events(booking_id) WHERE event_type='check_out';
COMMIT;

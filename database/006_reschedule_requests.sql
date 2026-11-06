-- New workflow only. Back up petday first. Does not overwrite existing bookings.
BEGIN;
CREATE TABLE IF NOT EXISTS public.booking_reschedule_requests (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 requested_by BIGINT NOT NULL REFERENCES public.users(id),
 proposed_date DATE NOT NULL,
 proposed_slot TEXT NOT NULL CHECK(proposed_slot IN ('08:30','10:00','13:30','15:00','17:30')),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 5 AND 500),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 resolved_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_reschedule_per_booking
 ON public.booking_reschedule_requests(booking_id) WHERE status='pending';
COMMIT;

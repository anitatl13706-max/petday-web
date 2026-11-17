-- PetDay V6.126 / reschedule slot constraint compatibility
-- Apply on a backed-up TEST database via pgAdmin Query Tool before retesting reschedule.
-- Preserves all rows; only replaces the legacy fixed-time CHECK constraint.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.booking_reschedule_requests') IS NULL THEN
  RAISE EXCEPTION 'Missing booking_reschedule_requests. Apply the previous migrations first.';
 END IF;
END $$;
ALTER TABLE public.booking_reschedule_requests
 DROP CONSTRAINT IF EXISTS booking_reschedule_requests_proposed_slot_check;
-- Match the schedule's time format. Service-specific time/capacity rules are checked in backend.
ALTER TABLE public.booking_reschedule_requests
 ADD CONSTRAINT booking_reschedule_requests_proposed_slot_check
 CHECK (proposed_slot ~ '^(0[8-9]|1[0-9]):[0-5][0-9]$');
COMMIT;

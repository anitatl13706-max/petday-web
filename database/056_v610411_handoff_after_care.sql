-- PetDay V6.104.11: distinguish care completion from physical return/handoff.
-- LOCAL petday only; backup first. Do not apply to production/Neon during local tests.
BEGIN;
DO $$ DECLARE con_name text; BEGIN
 FOR con_name IN SELECT con.conname FROM pg_constraint con
 WHERE con.conrelid='public.service_events'::regclass AND con.contype='c'
 AND pg_get_constraintdef(con.oid) LIKE '%event_type%'
 LOOP EXECUTE format('ALTER TABLE public.service_events DROP CONSTRAINT %I',con_name); END LOOP;
END $$;
ALTER TABLE public.service_events ADD CONSTRAINT service_events_event_type_check
 CHECK (event_type IN ('pet_arrived','check_in','care_update','ready','check_out','pet_handed_over'));
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_milestone_pet_handed_over
 ON public.service_events(booking_id) WHERE event_type='pet_handed_over';
-- Earlier completed bookings remain completed; this does not modify historical data.
COMMIT;

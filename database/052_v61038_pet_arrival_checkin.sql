-- PetDay V6.103.8: physical arrival is a separate event before service starts.
-- Apply to the LOCAL petday database after 051; back up first. Safe to rerun.
BEGIN;
DO $$
DECLARE constraint_name text;
BEGIN
  FOR constraint_name IN SELECT con.conname FROM pg_constraint con
    WHERE con.conrelid='public.service_events'::regclass AND con.contype='c'
      AND pg_get_constraintdef(con.oid) LIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.service_events DROP CONSTRAINT %I',constraint_name);
  END LOOP;
END $$;
ALTER TABLE public.service_events
 ADD CONSTRAINT service_events_event_type_check
 CHECK (event_type IN ('pet_arrived','check_in','care_update','ready','check_out'));
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_milestone_pet_arrived
 ON public.service_events(booking_id) WHERE event_type='pet_arrived';
COMMIT;

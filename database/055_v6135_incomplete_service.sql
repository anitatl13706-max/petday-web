-- V6.135: run once on PetDay TEST database before starting backend.
BEGIN;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT c.conname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname='bookings'
      AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%status%' AND pg_get_constraintdef(c.oid) ILIKE '%Hoàn tất%'
  LOOP EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I',r.conname); END LOOP;
END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_status_v135_check
 CHECK(status IN ('Đang chờ xác nhận','Đã xác nhận','Đang thực hiện','Hoàn tất','Không hoàn thành','Đã hủy'));
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT c.conname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname='service_events'
      AND c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%event_type%' AND pg_get_constraintdef(c.oid) ILIKE '%check_in%'
  LOOP EXECUTE format('ALTER TABLE public.service_events DROP CONSTRAINT %I',r.conname); END LOOP;
END $$;
ALTER TABLE public.service_events ADD CONSTRAINT service_events_event_type_v135_check
 CHECK(event_type IN ('pet_arrived','check_in','care_update','ready','check_out','pet_handed_over','incomplete'));
COMMIT;

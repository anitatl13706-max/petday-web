-- PetDay V6.88: cancelling a booking with pending Pet Taxi must not fail
-- because the original 018 status constraint omitted cancelled.
-- Backup PostgreSQL TEST before applying. Preserves all rows.
BEGIN;
DO $$
DECLARE c record; allowed text;
BEGIN
 IF to_regclass('public.pet_taxi_requests') IS NULL THEN
  RAISE EXCEPTION 'Missing public.pet_taxi_requests. Check migration 018 before proceeding.';
 END IF;
 FOR c IN SELECT conname, pg_get_constraintdef(oid) AS definition
          FROM pg_constraint
          WHERE conrelid='public.pet_taxi_requests'::regclass AND contype='c'
            AND pg_get_constraintdef(oid) LIKE '%status%' LOOP
  IF c.conname='pet_taxi_requests_status_check' THEN
   EXECUTE format('ALTER TABLE public.pet_taxi_requests DROP CONSTRAINT %I', c.conname);
  ELSE
   RAISE EXCEPTION 'Unrecognized Pet Taxi status constraint %, inspect before modifying: %', c.conname, c.definition;
  END IF;
 END LOOP;
 ALTER TABLE public.pet_taxi_requests ADD CONSTRAINT pet_taxi_requests_status_check
 CHECK (status IN ('requested','confirmed','completed','cancelled'));
END $$;
COMMIT;

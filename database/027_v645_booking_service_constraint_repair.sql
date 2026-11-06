-- V6.45 - SAFE REPAIR for old bookings_service_check that still allows only 3 packages.
-- BACK UP petday first. Inspect 022_v638_service_packages.sql and existing constraints.
-- This file only repairs the named CHECK constraint; no booking rows are updated/deleted.
-- It is safe to re-run: when all 8 package names are already allowed, nothing changes.
BEGIN;
DO $repair$
DECLARE actual TEXT;
BEGIN
 IF to_regclass('public.bookings') IS NULL THEN
  RAISE EXCEPTION 'Missing public.bookings; do not run this repair on an empty database.';
 END IF;
 SELECT pg_get_constraintdef(c.oid) INTO actual
 FROM pg_constraint c WHERE c.conrelid='public.bookings'::regclass AND c.conname='bookings_service_check' AND c.contype='c';
 IF actual IS NULL OR NOT (
   actual LIKE '%Grooming cơ bản%' AND actual LIKE '%Grooming toàn diện%' AND actual LIKE '%Grooming tạo kiểu%'
   AND actual LIKE '%Spa thư giãn%' AND actual LIKE '%Spa dưỡng lông%' AND actual LIKE '%Spa phục hồi lông%'
   AND actual LIKE '%Daycare nửa ngày%' AND actual LIKE '%Daycare cả ngày%'
 ) THEN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_check;
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_check
    CHECK (service IN (
     'Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu',
     'Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông',
     'Daycare nửa ngày','Daycare cả ngày'
    ));
  RAISE NOTICE 'Repaired bookings_service_check for eight packages.';
 ELSE
  RAISE NOTICE 'Eight package names already supported, no changes needed.';
 END IF;
END $repair$;
COMMIT;
-- Verify afterward: GET http://localhost:4000/api/health/services

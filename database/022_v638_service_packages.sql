-- V6.38: widen BOOKING service CHECK to match 8 server-validated packages.
-- Back up petday before running. This changes only a CHECK constraint; no data deleted.
-- Run ONCE after SQL 001-021. Inspect unexpected existing constraints before running.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.bookings') IS NULL THEN
  RAISE EXCEPTION 'Missing public.bookings. Apply prior migrations first.';
 END IF;
END $$;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_check
 CHECK (service IN (
  'Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu',
  'Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông',
  'Daycare nửa ngày','Daycare cả ngày'
 ));
COMMIT;

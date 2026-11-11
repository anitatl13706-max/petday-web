-- V6.101: Retain independent taxi direction and return address for each booking.
-- Run only on a backed-up local test database, AFTER 048 and 049.
ALTER TABLE public.pet_taxi_requests ADD COLUMN IF NOT EXISTS direction VARCHAR(12) NOT NULL DEFAULT 'pickup';
ALTER TABLE public.pet_taxi_requests ADD COLUMN IF NOT EXISTS return_address TEXT;
ALTER TABLE public.pet_taxi_requests DROP CONSTRAINT IF EXISTS pet_taxi_direction_valid;
ALTER TABLE public.pet_taxi_requests ADD CONSTRAINT pet_taxi_direction_valid CHECK (direction IN ('pickup','return','round_trip'));
ALTER TABLE public.pet_taxi_requests ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;

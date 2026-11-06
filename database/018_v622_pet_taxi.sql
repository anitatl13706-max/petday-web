-- PetDay V6.22: optional single pickup service, operator-confirmed, flat-area fee.
-- BACK UP petday before applying. Requires migrations up to 017. No deletes or data rewrites.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pet_taxi_requests (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
 zone TEXT NOT NULL CHECK(zone IN ('nearby','extended')),
 pickup_address TEXT NOT NULL CHECK(char_length(trim(pickup_address)) BETWEEN 12 AND 250),
 contact_phone TEXT NOT NULL,
 fee BIGINT NOT NULL CHECK(fee IN (70000,120000)),
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','completed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ,
 updated_by BIGINT REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_petday_taxi_status ON public.pet_taxi_requests(status,created_at);
COMMIT;

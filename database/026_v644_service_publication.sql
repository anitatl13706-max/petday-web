-- PetDay V6.44: allow Admin to suspend taking NEW appointments for one of eight existing packages.
-- BACK UP petday, run once after 025. Old appointments and prices remain unchanged.
BEGIN;
ALTER TABLE public.service_price_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
COMMIT;

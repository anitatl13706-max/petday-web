-- PetDay V6.97+: customer default delivery/pickup address. Run ONCE in Neon SQL Editor before deploying code.
-- Existing orders and bookings are never altered.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_delivery_zone VARCHAR(20);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_default_address_length;
ALTER TABLE public.users ADD CONSTRAINT users_default_address_length CHECK (default_address IS NULL OR char_length(default_address) BETWEEN 12 AND 250);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_default_delivery_zone_valid;
ALTER TABLE public.users ADD CONSTRAINT users_default_delivery_zone_valid CHECK (default_delivery_zone IS NULL OR default_delivery_zone IN ('inner_hcm','outer_hcm'));

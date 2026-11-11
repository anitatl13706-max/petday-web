-- PetDay V6.98 local-first additive migration. Apply only to a backup/testing DB first.
-- Check existing duplicate values before running the unique index.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
CREATE UNIQUE INDEX IF NOT EXISTS users_contact_phone_unique_v698
  ON public.users(contact_phone) WHERE contact_phone IS NOT NULL AND contact_phone <> '';
-- Daycare pick-up time is kept in booking line_items to avoid altering legacy booking state machines.

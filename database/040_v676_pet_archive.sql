-- V6.76: safe archive. Backup PostgreSQL TEST before running once.
-- Does not delete pets or bookings.
BEGIN;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS idx_pets_owner_active ON public.pets(owner_id, id) WHERE archived_at IS NULL;
COMMIT;

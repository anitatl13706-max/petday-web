-- V6.37: moderated customer reviews. Backup database before applying.
-- Reviews are private until approved by Admin; existing reviews are retained, not deleted.
BEGIN;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.reviews'::regclass AND conname='petday_review_moderation_status') THEN
  ALTER TABLE public.reviews ADD CONSTRAINT petday_review_moderation_status CHECK (moderation_status IN ('pending','approved','rejected'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_petday_reviews_moderation ON public.reviews(moderation_status,created_at DESC);
COMMIT;

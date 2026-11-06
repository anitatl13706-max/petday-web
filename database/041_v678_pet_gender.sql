-- PetDay V6.78: add optional gender metadata without altering existing pet/booking records.
-- BACK UP your TEST database and verify current pets structure before applying once.
BEGIN;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS gender TEXT;
UPDATE public.pets SET gender = 'Chưa xác định' WHERE gender IS NULL;
ALTER TABLE public.pets ALTER COLUMN gender SET DEFAULT 'Chưa xác định';
ALTER TABLE public.pets ALTER COLUMN gender SET NOT NULL;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.pets'::regclass AND conname='pets_gender_v678_check') THEN
  ALTER TABLE public.pets ADD CONSTRAINT pets_gender_v678_check CHECK (gender IN ('Đực','Cái','Chưa xác định'));
 END IF;
END $$;
COMMIT;

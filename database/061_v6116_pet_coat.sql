-- PetDay V6.116: pet coat profile (run once against a backed-up TEST database)
BEGIN;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS coat TEXT NOT NULL DEFAULT 'Chưa xác định';
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_coat_check;
ALTER TABLE public.pets ADD CONSTRAINT pets_coat_check CHECK (coat IN ('Chưa xác định','Lông ngắn','Lông dài','Lông xoăn','Lông kép','Lông thưa / ít lông','Không lông'));
COMMIT;

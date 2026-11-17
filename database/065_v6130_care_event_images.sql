-- PetDay V6.130: private, persistent images for append-only care events.
-- Additive migration. Back up the petday database first; requires service_events and users.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.service_events') IS NULL
    OR to_regclass('public.bookings') IS NULL
    OR to_regclass('public.users') IS NULL THEN
  RAISE EXCEPTION 'Missing prerequisite tables. Apply earlier migrations before 065.';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.care_event_images (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
 service_event_id BIGINT NOT NULL REFERENCES public.service_events(id) ON DELETE RESTRICT,
 storage_key TEXT NOT NULL UNIQUE CHECK (storage_key ~ '^[a-f0-9-]+\.(jpg|png|webp)$'),
 original_name TEXT NOT NULL CHECK (char_length(original_name) BETWEEN 1 AND 240),
 mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
 byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
 uploaded_by BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_events_id_booking
 ON public.service_events(id,booking_id);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_care_event_image_event_booking') THEN
  ALTER TABLE public.care_event_images ADD CONSTRAINT fk_care_event_image_event_booking
   FOREIGN KEY(service_event_id,booking_id)
   REFERENCES public.service_events(id,booking_id) ON DELETE RESTRICT;
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_care_event_images_event
 ON public.care_event_images(service_event_id,id);
CREATE INDEX IF NOT EXISTS idx_care_event_images_booking
 ON public.care_event_images(booking_id,service_event_id);
COMMIT;

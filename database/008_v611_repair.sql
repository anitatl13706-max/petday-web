-- V6.11: REPAIR ONLY. Run in database petday AFTER A BACKUP. Does not delete or overwrite existing rows.
BEGIN;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS public.booking_reschedule_requests (
 id BIGSERIAL PRIMARY KEY,booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
 requested_by BIGINT NOT NULL REFERENCES public.users(id), proposed_date DATE NOT NULL,proposed_slot TEXT NOT NULL,
 reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),resolved_at TIMESTAMPTZ,
 CONSTRAINT booking_reschedule_status_check CHECK(status IN ('pending','approved','rejected'))
);
CREATE TABLE IF NOT EXISTS public.promotions (
 id BIGSERIAL PRIMARY KEY,
 code TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,32}$'),
 discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed','percent')),
 discount_value INTEGER NOT NULL CHECK (discount_value>0 AND (discount_type<>'percent' OR discount_value<=100)),
 max_discount INTEGER CHECK (max_discount>0),
 min_order INTEGER NOT NULL DEFAULT 0 CHECK (min_order>=0),
 service_name TEXT,
 starts_at TIMESTAMPTZ NOT NULL,
 ends_at TIMESTAMPTZ NOT NULL,
 max_uses INTEGER CHECK (max_uses>0),
 max_per_customer INTEGER NOT NULL DEFAULT 1 CHECK (max_per_customer>0),
 active BOOLEAN NOT NULL DEFAULT true,
 CHECK (ends_at>starts_at)
);
COMMIT;

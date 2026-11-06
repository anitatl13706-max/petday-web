-- PETDAY V6.12 / ADDITIVE SCHEMA UPGRADE
-- BACK UP database petday FIRST. Run in Query Tool connected to petday, ONCE.
-- No DROP TABLE, DELETE, TRUNCATE or row overwrites. Transaction rolls back on errors.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookings')
  OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users')
  OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pets')
  THEN RAISE EXCEPTION 'Missing core tables. Stop; do not re-run foundational migrations blindly.';
  END IF;
END $$;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
CREATE TABLE IF NOT EXISTS public.consultation_requests (
 id BIGSERIAL PRIMARY KEY,customer_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
 contact_name VARCHAR(120) NOT NULL,contact_email VARCHAR(200) NOT NULL,
 question TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
 id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,expires_at TIMESTAMPTZ NOT NULL,used_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
-- Prior V6.2 schema only permitted simulation; allow manual verified bank/cash payment.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK(payment_status IN
 ('Chưa thanh toán','Đã thanh toán','Thanh toán mô phỏng thành công','Thanh toán thất bại (mô phỏng)','Đã hoàn tiền (mô phỏng)'));
CREATE TABLE IF NOT EXISTS public.booking_reschedule_requests (
 id BIGSERIAL PRIMARY KEY,booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 requested_by BIGINT NOT NULL REFERENCES public.users(id),proposed_date DATE NOT NULL,
 proposed_slot TEXT NOT NULL,reason TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),resolved_at TIMESTAMPTZ,
 CONSTRAINT v612_reschedule_status_check CHECK(status IN ('pending','approved','rejected','cancelled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_reschedule_per_booking ON public.booking_reschedule_requests(booking_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS public.promotions (
 id BIGSERIAL PRIMARY KEY,code TEXT UNIQUE NOT NULL CHECK(code ~ '^[A-Z0-9_-]{3,32}$'),
 discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed','percent')),
 discount_value INTEGER NOT NULL CHECK(discount_value>0 AND (discount_type<>'percent' OR discount_value<=100)),
 max_discount INTEGER CHECK(max_discount>0),min_order INTEGER NOT NULL DEFAULT 0 CHECK(min_order>=0),
 service_name TEXT,starts_at TIMESTAMPTZ NOT NULL,ends_at TIMESTAMPTZ NOT NULL,
 max_uses INTEGER CHECK(max_uses>0),max_per_customer INTEGER NOT NULL DEFAULT 1 CHECK(max_per_customer>0),
 active BOOLEAN NOT NULL DEFAULT true,CHECK(ends_at>starts_at)
);
CREATE INDEX IF NOT EXISTS idx_bookings_promo ON public.bookings(promo_code) WHERE promo_code IS NOT NULL;
-- Durable, owned notifications; populated only when an actual business action occurs.
CREATE TABLE IF NOT EXISTS public.account_notifications (
 id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 title TEXT NOT NULL,body TEXT NOT NULL,booking_code TEXT,
 read_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON public.account_notifications(user_id,created_at DESC);
-- A real admin can record a payment decision. This table is audit history, not bank confirmation.
CREATE TABLE IF NOT EXISTS public.payment_events (
 id BIGSERIAL PRIMARY KEY,booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 admin_id BIGINT NOT NULL REFERENCES public.users(id),previous_status TEXT NOT NULL,
 new_status TEXT NOT NULL,reference TEXT,note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_booking ON public.payment_events(booking_id,created_at DESC);
COMMIT;

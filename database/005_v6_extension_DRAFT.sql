-- PETDAY V6 — ARCHITECTURAL DRAFT ONLY / NOT A TESTED MIGRATION
-- DO NOT execute on the user's existing petday database without review,
-- migration rehearsal in a disposable database, backup and E2E tests.
-- The current bookings table uses TEXT service and branch and is NOT yet migrated
-- to foreign keys. This file creates only possible future structures.
BEGIN;
CREATE TABLE IF NOT EXISTS public.service_catalog (
 id BIGSERIAL PRIMARY KEY,
 code TEXT UNIQUE NOT NULL,
 title TEXT NOT NULL,
 category TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 base_price BIGINT NOT NULL CHECK(base_price >= 0),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
 species TEXT[] NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS public.service_addons (
 id BIGSERIAL PRIMARY KEY,
 service_id BIGINT NOT NULL REFERENCES public.service_catalog(id),
 title TEXT NOT NULL, price BIGINT NOT NULL CHECK(price >= 0), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS public.service_products (
 id BIGSERIAL PRIMARY KEY,
 sku TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
 species TEXT[] NOT NULL DEFAULT '{}', price BIGINT NOT NULL CHECK(price >= 0),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS public.petday_branches (
 id BIGSERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 address TEXT, active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS public.booking_reschedule_requests (
 id BIGSERIAL PRIMARY KEY, booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 requested_by BIGINT NOT NULL REFERENCES public.users(id),
 proposed_date DATE NOT NULL, proposed_slot TEXT NOT NULL,
 reason TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','approved','rejected','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), resolved_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.booking_events (
 id BIGSERIAL PRIMARY KEY, booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 actor_id BIGINT REFERENCES public.users(id), event_type TEXT NOT NULL,
 detail JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.petday_notifications (
 id BIGSERIAL PRIMARY KEY, booking_id BIGINT REFERENCES public.bookings(id),
 recipient_id BIGINT REFERENCES public.users(id), channel TEXT NOT NULL,
 template_key TEXT NOT NULL, due_at TIMESTAMPTZ NOT NULL,
 status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','processing','sent','failed','cancelled')),
 attempt_count INT NOT NULL DEFAULT 0, sent_at TIMESTAMPTZ,
 UNIQUE(booking_id,recipient_id,channel,template_key,due_at)
);
COMMIT;

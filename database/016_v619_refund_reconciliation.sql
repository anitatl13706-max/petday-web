-- PetDay V6.19: refund request and manual reconciliation; ADDITIVE ONLY.
-- Back up petday first. Requires migration 015_v618_reminders_reports.sql.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.bookings') IS NULL OR to_regclass('public.users') IS NULL
 OR to_regclass('public.account_notifications') IS NULL
 THEN RAISE EXCEPTION 'Missing earlier migration; stop and inspect /api/health/schema'; END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.refund_requests (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL UNIQUE REFERENCES public.bookings(id),
 customer_id BIGINT NOT NULL REFERENCES public.users(id),
 amount BIGINT NOT NULL CHECK(amount>0),
 reason TEXT NOT NULL CHECK(length(trim(reason))>=10),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
 admin_note TEXT,
 refund_reference TEXT,
 processed_by BIGINT REFERENCES public.users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 completed_at TIMESTAMPTZ,
 CONSTRAINT refund_complete_requires_reference CHECK(status<>'completed' OR (refund_reference IS NOT NULL AND length(trim(refund_reference))>=4))
);
CREATE INDEX IF NOT EXISTS refund_requests_customer_time ON public.refund_requests(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS refund_requests_status_time ON public.refund_requests(status,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS refund_unique_external_reference ON public.refund_requests(refund_reference) WHERE refund_reference IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.refund_events (
 id BIGSERIAL PRIMARY KEY,
 refund_id BIGINT NOT NULL REFERENCES public.refund_requests(id),
 actor_id BIGINT NOT NULL REFERENCES public.users(id),
 previous_status TEXT NOT NULL,
 new_status TEXT NOT NULL,
 note TEXT,
 reference TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refund_events_refund_time ON public.refund_events(refund_id,created_at DESC);
COMMIT;

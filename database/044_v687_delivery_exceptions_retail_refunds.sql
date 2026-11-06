-- PetDay V6.87: delivery exception history and separately-reviewed retail refunds.
-- Backup PostgreSQL TEST. Execute once after migrations through 043. Does NOT delete orders or receipts.
BEGIN;
DO $$ BEGIN IF to_regclass('public.retail_orders') IS NULL OR to_regclass('public.retail_order_events') IS NULL THEN RAISE EXCEPTION 'Missing retail base schema; check earlier migrations'; END IF; END $$;
ALTER TABLE public.retail_orders DROP CONSTRAINT IF EXISTS retail_orders_status_check;
ALTER TABLE public.retail_orders ADD CONSTRAINT retail_orders_status_check CHECK (status IN ('pending','confirmed','ready','shipping','delivery_failed','return_pending','returned','completed','cancelled'));
CREATE TABLE IF NOT EXISTS public.retail_delivery_events (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES public.retail_orders(id), actor_id BIGINT NOT NULL REFERENCES public.users(id),
 action TEXT NOT NULL CHECK(action IN ('failed','retry','return_pending','returned')), reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retail_delivery_events_order ON public.retail_delivery_events(order_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.retail_refund_requests (
 id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL UNIQUE REFERENCES public.retail_orders(id),
 amount BIGINT NOT NULL CHECK(amount>0),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
 admin_note TEXT,refund_reference TEXT UNIQUE,processed_by BIGINT REFERENCES public.users(id),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),completed_at TIMESTAMPTZ
);
COMMIT;

-- V6.90: customer cancellation requests for standalone retail orders.
-- Run once on a BACKED-UP TEST database after migration 044. No data deletion.
BEGIN;
CREATE TABLE IF NOT EXISTS public.retail_cancellation_requests (
 id BIGSERIAL PRIMARY KEY,
 order_id BIGINT NOT NULL UNIQUE REFERENCES public.retail_orders(id),
 reason TEXT NOT NULL CHECK(length(trim(reason))>=10),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 admin_note TEXT,
 decided_by BIGINT REFERENCES public.users(id),
 decided_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retail_cancellation_status ON public.retail_cancellation_requests(status,created_at DESC);
COMMIT;

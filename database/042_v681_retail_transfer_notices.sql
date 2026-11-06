-- PetDay V6.81: customer reports for shop bank transfer payments.
-- Reporting does NOT change the paid flag. This is a separate, auditable request.
BEGIN;
CREATE TABLE IF NOT EXISTS public.retail_transfer_notices (
 order_id BIGINT PRIMARY KEY REFERENCES public.retail_orders(id) ON DELETE RESTRICT,
 customer_reference TEXT,
 customer_note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retail_transfer_notices_updated
 ON public.retail_transfer_notices(updated_at DESC);
COMMIT;

-- PetDay V6.67 - Optional but REQUIRED for delivery tracking in Admin.
-- Back up PostgreSQL TEST before running. Do not run SQL 001-038 again.
-- Preserves existing orders and payments. Safe to execute ONCE on matching V6.66 schema.
BEGIN;
DO $$
BEGIN
 IF to_regclass('public.retail_orders') IS NULL THEN
   RAISE EXCEPTION 'Missing retail_orders. Apply prior migrations first.';
 END IF;
END $$;
ALTER TABLE public.retail_orders ADD COLUMN IF NOT EXISTS delivery_eta DATE;
ALTER TABLE public.retail_orders DROP CONSTRAINT IF EXISTS retail_orders_status_check;
ALTER TABLE public.retail_orders ADD CONSTRAINT retail_orders_status_check
 CHECK (status IN ('pending','confirmed','ready','shipping','completed','cancelled'));
COMMIT;

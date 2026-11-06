-- V6.60 TEST: allow purchase of up to 99 units per item in standalone retail orders.
-- This does not alter booking_retail_items / the booking recommendation limit.
-- Back up TEST before executing. No data is deleted.
BEGIN;
DO $$ DECLARE c RECORD; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.retail_order_items'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%quantity%' LOOP
  EXECUTE format('ALTER TABLE public.retail_order_items DROP CONSTRAINT %I', c.conname);
 END LOOP;
END $$;
ALTER TABLE public.retail_order_items ADD CONSTRAINT retail_order_items_quantity_range_v660 CHECK (quantity BETWEEN 1 AND 99);
COMMIT;

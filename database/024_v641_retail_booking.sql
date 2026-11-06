-- V6.41. Run ONCE after 023, after PostgreSQL backup. No deletes or rewrites of existing bookings.
BEGIN;
CREATE TABLE IF NOT EXISTS public.retail_products (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('Vệ sinh','Chăm sóc','Phụ kiện')),
 description TEXT NOT NULL DEFAULT '',price BIGINT NOT NULL CHECK(price >= 1000),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.booking_retail_items (
 id BIGSERIAL PRIMARY KEY,booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
 product_id BIGINT NOT NULL REFERENCES public.retail_products(id) ON DELETE RESTRICT,
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 3),unit_price BIGINT NOT NULL CHECK(unit_price >= 0),
 returned_at TIMESTAMPTZ,UNIQUE(booking_id,product_id));
-- Release reserved inventory once only if a booking changes to cancelled.
CREATE OR REPLACE FUNCTION public.petday_release_retail_on_cancel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='Đã hủy' AND OLD.status IS DISTINCT FROM 'Đã hủy' THEN
   UPDATE public.retail_products p SET stock=p.stock+i.quantity,updated_at=now()
   FROM public.booking_retail_items i WHERE i.booking_id=NEW.id AND i.product_id=p.id AND i.returned_at IS NULL;
   UPDATE public.booking_retail_items SET returned_at=now() WHERE booking_id=NEW.id AND returned_at IS NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_petday_retail_cancel ON public.bookings;
CREATE TRIGGER trg_petday_retail_cancel AFTER UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.petday_release_retail_on_cancel();
-- Seed products only for fresh catalog (no duplicate name). Prices are educational examples.
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM (VALUES
('Khăn lau thú cưng','Vệ sinh','Khăn lau nhanh sau khi đi dạo',45000::bigint,20),
('Lược chải lông mềm','Chăm sóc','Dùng chải lông tại nhà',79000::bigint,12),
('Bát ăn du lịch','Phụ kiện','Bát gấp gọn cho chó mèo',65000::bigint,15),
('Túi đựng đồ đi spa','Phụ kiện','Đựng đồ dùng cá nhân của thú cưng',99000::bigint,8)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS(SELECT 1 FROM public.retail_products p WHERE p.name=v.name);
COMMIT;

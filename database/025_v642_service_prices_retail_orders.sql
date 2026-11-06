-- V6.42: run AFTER 024 on a backed-up petday database. No existing bookings or products deleted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.service_price_settings (
 name TEXT PRIMARY KEY,
 base_price BIGINT NOT NULL CHECK(base_price BETWEEN 20000 AND 5000000),
 updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.service_price_settings(name,base_price) VALUES
 ('Grooming cơ bản',140000),('Grooming toàn diện',180000),('Grooming tạo kiểu',260000),
 ('Spa thư giãn',220000),('Spa dưỡng lông',280000),('Spa phục hồi lông',350000),
 ('Daycare nửa ngày',190000),('Daycare cả ngày',320000)
ON CONFLICT(name) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.retail_orders (
 id BIGSERIAL PRIMARY KEY,code TEXT NOT NULL UNIQUE,
 customer_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 branch TEXT NOT NULL CHECK(branch IN ('PetDay Thảo Điền','PetDay Phú Mỹ Hưng')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','ready','completed','cancelled')),
 payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','bank_transfer')),
 payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid')),
 payment_reference TEXT UNIQUE,paid_at TIMESTAMPTZ,
 total BIGINT NOT NULL CHECK(total>=0),
 idempotency_key TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(customer_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.retail_order_items (
 id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL REFERENCES public.retail_orders(id) ON DELETE RESTRICT,
 product_id BIGINT NOT NULL REFERENCES public.retail_products(id) ON DELETE RESTRICT,
 quantity INT NOT NULL CHECK(quantity BETWEEN 1 AND 3),unit_price BIGINT NOT NULL CHECK(unit_price>0),
 UNIQUE(order_id,product_id)
);
CREATE TABLE IF NOT EXISTS public.retail_order_events (
 id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL REFERENCES public.retail_orders(id) ON DELETE RESTRICT,
 actor_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
 event_type TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retail_orders_customer ON public.retail_orders(customer_id,created_at DESC);
COMMIT;

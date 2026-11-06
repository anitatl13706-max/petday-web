-- PetDay V6.9: apply ONCE to existing petday after backup. Do not rerun base migrations.
BEGIN;
CREATE TABLE IF NOT EXISTS promotions (
 id BIGSERIAL PRIMARY KEY,
 code TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,32}$'),
 discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed','percent')),
 discount_value INTEGER NOT NULL CHECK (discount_value>0 AND (discount_type<>'percent' OR discount_value<=100)),
 max_discount INTEGER CHECK (max_discount>0),
 min_order INTEGER NOT NULL DEFAULT 0 CHECK (min_order>=0),
 service_name TEXT,
 starts_at TIMESTAMPTZ NOT NULL,
 ends_at TIMESTAMPTZ NOT NULL,
 max_uses INTEGER CHECK (max_uses>0),
 max_per_customer INTEGER NOT NULL DEFAULT 1 CHECK (max_per_customer>0),
 active BOOLEAN NOT NULL DEFAULT true,
 CHECK (ends_at>starts_at)
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code TEXT REFERENCES promotions(code);
CREATE INDEX IF NOT EXISTS idx_bookings_promo ON bookings(promo_code) WHERE promo_code IS NOT NULL;
COMMIT;
-- No live promotional codes inserted. Configure valid promotions explicitly in pgAdmin.

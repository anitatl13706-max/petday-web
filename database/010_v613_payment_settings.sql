-- PETDAY V6.13. Back up the petday database before applying.
-- Requires schema through 009; additive migration, no user or booking data deleted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.business_payment_settings (
 id SMALLINT PRIMARY KEY CHECK(id=1),
 bank_name VARCHAR(100) NOT NULL,
 account_number VARCHAR(25) NOT NULL CHECK(account_number ~ '^[0-9]{6,25}$'),
 account_holder VARCHAR(120) NOT NULL,
 updated_by BIGINT REFERENCES public.users(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;

-- PetDay: first PostgreSQL foundation, NOT yet wired to Figma frontend.
-- PostgreSQL >= 14. Do not run against an existing database without reviewing migrations.
BEGIN;
CREATE TABLE IF NOT EXISTS app_users (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 full_name TEXT NOT NULL,
 phone TEXT,
 role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','staff','admin')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pets (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 owner_id BIGINT NOT NULL REFERENCES app_users(id),
 name TEXT NOT NULL,
 species TEXT NOT NULL CHECK (species IN ('dog','cat')),
 breed TEXT,
 age_years NUMERIC(5,2) CHECK (age_years >= 0),
 weight_kg NUMERIC(7,2) NOT NULL CHECK (weight_kg > 0),
 notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_id)
);
CREATE TABLE IF NOT EXISTS branches (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name TEXT NOT NULL UNIQUE,
 address TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS services (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name TEXT NOT NULL UNIQUE,
 base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
 duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
 active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS booking_slots (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 branch_id BIGINT NOT NULL REFERENCES branches(id),
 service_id BIGINT NOT NULL REFERENCES services(id),
 start_at TIMESTAMPTZ NOT NULL,
 capacity INTEGER NOT NULL CHECK (capacity > 0),
 UNIQUE(branch_id, service_id, start_at)
);
CREATE TABLE IF NOT EXISTS bookings (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code TEXT NOT NULL UNIQUE,
 customer_id BIGINT NOT NULL REFERENCES app_users(id),
 pet_id BIGINT NOT NULL,
 slot_id BIGINT NOT NULL REFERENCES booking_slots(id),
 booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending','confirmed','in_progress','completed','cancelled')),
 payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','demo_paid','demo_failed','demo_refunded')),
 total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
 idempotency_key TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY (pet_id,customer_id) REFERENCES pets(id,owner_id),
 UNIQUE(customer_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_booking_slot_status ON bookings(slot_id,booking_status);
CREATE TABLE IF NOT EXISTS booking_items (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
 item_type TEXT NOT NULL CHECK (item_type IN ('base','weight','addon','taxi','product','discount')),
 label TEXT NOT NULL,
 quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
 amount NUMERIC(12,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS care_records (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
 notes TEXT NOT NULL,
 care_date DATE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(id),
 customer_id BIGINT NOT NULL REFERENCES app_users(id),
 rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
 comment TEXT NOT NULL CHECK (length(trim(comment)) > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
-- Enforcement of capacity and status/role transitions must be implemented in a transactional API.

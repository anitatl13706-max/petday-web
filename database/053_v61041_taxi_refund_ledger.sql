-- V6.104.1: manual refund ledger per Taxi direction. Apply after 051/052, LOCAL BACKUP FIRST.
BEGIN;
CREATE TABLE IF NOT EXISTS public.taxi_refund_requests (
 id BIGSERIAL PRIMARY KEY,
 taxi_leg_id BIGINT NOT NULL UNIQUE REFERENCES public.pet_taxi_legs(id),
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 customer_id BIGINT NOT NULL REFERENCES public.users(id),
 amount BIGINT NOT NULL CHECK(amount>0),
 reason TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
 admin_note TEXT,
 refund_reference VARCHAR(120) UNIQUE,
 processed_by BIGINT REFERENCES public.users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS taxi_refund_requests_booking_idx ON public.taxi_refund_requests(booking_id,status);
CREATE TABLE IF NOT EXISTS public.taxi_refund_events (
 id BIGSERIAL PRIMARY KEY,
 refund_id BIGINT NOT NULL REFERENCES public.taxi_refund_requests(id),
 actor_id BIGINT NOT NULL REFERENCES public.users(id),
 previous_status TEXT NOT NULL,
 new_status TEXT NOT NULL,
 note TEXT,
 reference VARCHAR(120),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;

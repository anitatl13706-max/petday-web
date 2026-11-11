-- V6.103.7: Independent taxi legs and incident audit. LOCAL DB BACKUP REQUIRED.
-- Apply AFTER 050; additive and idempotent. Does not alter historical bookings or payments.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pet_taxi_legs (
 id BIGSERIAL PRIMARY KEY,
 taxi_request_id BIGINT NOT NULL REFERENCES public.pet_taxi_requests(id),
 booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
 leg TEXT NOT NULL CHECK(leg IN ('pickup','return')),
 fee BIGINT NOT NULL CHECK(fee>=0),
 state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN ('requested','confirmed','en_route','arrived','contacting','completed','customer_self','no_show','provider_fault','cancelled','under_review')),
 scheduled_at TIMESTAMPTZ,
 departed_at TIMESTAMPTZ,
 arrived_at TIMESTAMPTZ,
 arrived_correctly BOOLEAN,
 contact_count INTEGER NOT NULL DEFAULT 0 CHECK(contact_count BETWEEN 0 AND 20),
 contact_last_at TIMESTAMPTZ,
 issue_note TEXT,
 customer_plan TEXT CHECK(customer_plan IN ('self_arrival','ask_cancel','ask_reschedule','unreachable') OR customer_plan IS NULL),
 refund_due BIGINT NOT NULL DEFAULT 0 CHECK(refund_due>=0),
 updated_by BIGINT REFERENCES public.users(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(taxi_request_id,leg),
 UNIQUE(booking_id,leg)
);
CREATE TABLE IF NOT EXISTS public.pet_taxi_leg_events (
 id BIGSERIAL PRIMARY KEY,
 taxi_leg_id BIGINT NOT NULL REFERENCES public.pet_taxi_legs(id),
 actor_id BIGINT NOT NULL REFERENCES public.users(id),
 action TEXT NOT NULL,
 previous_state TEXT NOT NULL,
 next_state TEXT NOT NULL,
 note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS taxi_leg_events_time_idx ON public.pet_taxi_leg_events(taxi_leg_id,created_at);
-- Existing taxi requests get independent legs. No reinterpretation of old payment events.
INSERT INTO public.pet_taxi_legs(taxi_request_id,booking_id,leg,fee,state)
SELECT t.id,t.booking_id,'pickup',CASE WHEN t.direction='round_trip' THEN t.fee/2 ELSE t.fee END,
 CASE WHEN t.status='completed' THEN 'completed' WHEN t.status='cancelled' THEN 'cancelled' WHEN t.status='confirmed' THEN 'confirmed' ELSE 'requested' END
FROM public.pet_taxi_requests t WHERE t.direction IN('pickup','round_trip')
ON CONFLICT(taxi_request_id,leg) DO NOTHING;
INSERT INTO public.pet_taxi_legs(taxi_request_id,booking_id,leg,fee,state)
SELECT t.id,t.booking_id,'return',CASE WHEN t.direction='round_trip' THEN t.fee/2 ELSE t.fee END,
 CASE WHEN t.direction='return' AND t.status='completed' OR t.direction='round_trip' AND t.return_completed_at IS NOT NULL THEN 'completed'
 WHEN t.status='cancelled' THEN 'cancelled'
 WHEN t.status='confirmed' THEN 'confirmed' ELSE 'requested' END
FROM public.pet_taxi_requests t WHERE t.direction IN('return','round_trip')
ON CONFLICT(taxi_request_id,leg) DO NOTHING;
COMMIT;

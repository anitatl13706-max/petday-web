-- PetDay V6.131: audit the cause of booking cancellation for account-level prepayment policy.
-- Additive migration; it does not alter existing booking/payment amounts or statuses.
BEGIN;
DO $$ BEGIN
 IF to_regclass('public.bookings') IS NULL OR to_regclass('public.users') IS NULL THEN
  RAISE EXCEPTION 'Missing prerequisite tables. Apply earlier migrations before 066.';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_cancellation_events (
 id BIGSERIAL PRIMARY KEY,
 booking_id BIGINT NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
 customer_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 origin TEXT NOT NULL CHECK(origin IN ('customer','provider','no_show','system')),
 recorded_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 note TEXT NOT NULL DEFAULT '' CHECK(char_length(note)<=800)
);
CREATE INDEX IF NOT EXISTS idx_booking_cancel_events_customer_time
 ON public.booking_cancellation_events(customer_id,occurred_at DESC,id DESC);

-- Preserve historical facts using existing audited requests/no-show records.
INSERT INTO public.booking_cancellation_events(booking_id,customer_id,origin,recorded_by,occurred_at,note)
SELECT b.id,b.customer_id,
 CASE
  WHEN ns.booking_id IS NOT NULL THEN 'no_show'
  WHEN EXISTS(SELECT 1 FROM booking_cancellation_requests cr WHERE cr.booking_id=b.id AND cr.status='approved' AND cr.customer_id=b.customer_id) THEN 'customer'
  ELSE 'system'
 END,
 COALESCE(ns.recorded_by,(SELECT cr.resolved_by FROM booking_cancellation_requests cr WHERE cr.booking_id=b.id AND cr.status='approved' ORDER BY cr.resolved_at DESC NULLS LAST,cr.id DESC LIMIT 1)),
 COALESCE(ns.recorded_at,(SELECT COALESCE(cr.resolved_at,cr.created_at) FROM booking_cancellation_requests cr WHERE cr.booking_id=b.id AND cr.status='approved' ORDER BY cr.resolved_at DESC NULLS LAST,cr.id DESC LIMIT 1),b.created_at),
 'Backfill từ lịch sử hủy trước migration 066'
FROM bookings b LEFT JOIN booking_no_shows ns ON ns.booking_id=b.id
WHERE b.status='Đã hủy'
ON CONFLICT(booking_id) DO NOTHING;
COMMIT;

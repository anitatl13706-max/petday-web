-- PetDay V6.104.11.1: repair ONLY legacy records incorrectly marked completed
-- while care is done but return Taxi has not handed the pet back.
-- LOCAL petday: backup first; inspect the SELECT preview below before updating.
-- No changes to payments, taxi fees, refund ledgers, or genuinely completed handoffs.
BEGIN;
-- Repair only when all safeguards match: existing check_out, missing handoff,
-- return leg exists and was not completed, and booking still says completed.
UPDATE public.bookings AS b
SET status='Đang thực hiện'
WHERE b.status='Hoàn tất'
  AND EXISTS (
    SELECT 1 FROM public.service_events AS s
    WHERE s.booking_id=b.id AND s.event_type='check_out'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.service_events AS s
    WHERE s.booking_id=b.id AND s.event_type='pet_handed_over'
  )
  AND EXISTS (
    SELECT 1 FROM public.pet_taxi_legs AS l
    WHERE l.booking_id=b.id AND l.leg='return' AND l.state NOT IN ('completed','cancelled','customer_self','provider_fault','no_show')
  );
COMMIT;

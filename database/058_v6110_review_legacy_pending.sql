-- OPTIONAL, run ONLY after backup on a TEST database.
-- Preview legacy records that are still pending service confirmation,
-- excluding bookings where care or Taxi has already started.
SELECT b.code,b.booking_date,b.slot,b.status,b.payment_status
FROM public.bookings b
WHERE b.status='Đang chờ xác nhận'
  AND (b.booking_date::timestamp + b.slot::time) > (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  AND NOT EXISTS (SELECT 1 FROM public.service_events e WHERE e.booking_id=b.id)
  AND NOT EXISTS (SELECT 1 FROM public.booking_cancellation_requests cr WHERE cr.booking_id=b.id AND cr.status='pending')
  AND NOT EXISTS (SELECT 1 FROM public.pet_taxi_legs tl WHERE tl.booking_id=b.id AND tl.state NOT IN ('requested','confirmed'))
ORDER BY b.booking_date,b.slot;

-- No UPDATE is performed by this script.
-- Do not blanket-confirm historical pending bookings without reviewing capacity,
-- payment terms, and customer notifications.

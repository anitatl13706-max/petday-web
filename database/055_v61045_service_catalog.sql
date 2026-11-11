-- PetDay V6.104.5: add two service packages without modifying booked data.
-- Run on backed-up LOCAL PostgreSQL after 054. Source controls add-on prices.
BEGIN;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_service_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_check CHECK(service IN (
 'Grooming vệ sinh nhanh','Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu',
 'Spa dịu nhẹ','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông',
 'Daycare nửa ngày','Daycare cả ngày'));
INSERT INTO public.service_price_settings(name,base_price) VALUES
 ('Grooming vệ sinh nhanh',110000),('Spa dịu nhẹ',190000)
ON CONFLICT(name) DO NOTHING;
COMMIT;

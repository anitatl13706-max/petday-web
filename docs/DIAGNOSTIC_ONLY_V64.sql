-- CHỈ ĐỌC: chạy riêng lẻ sau ROLLBACK; KHÔNG THAY ĐỔI DỮ LIỆU
ROLLBACK;
SELECT current_database() AS database_name, current_schema() AS schema_name;
SELECT to_regclass('public.bookings') AS bookings_table, to_regclass('public.business_payment_settings') AS bank_table;
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid='public.bookings'::regclass AND contype='c';
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('bookings','business_payment_settings') ORDER BY table_name, ordinal_position;

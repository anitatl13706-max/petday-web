// V6.36 read-only schema diagnostic. Never modifies the database.
import 'dotenv/config';
import pg from 'pg';
const migrationLookup={business_payment_settings:'010_v613_payment_settings.sql',service_events:'011_v614_service_timeline.sql',blocked_slots:'012_v615_capacity_management.sql',staff_members:'013_v616_staff_dispatch.sql',staff_shifts:'013_v616_staff_dispatch.sql',booking_assignments:'013_v616_staff_dispatch.sql',staff_assignment_events:'013_v616_staff_dispatch.sql',booking_no_shows:'014_v617_no_show.sql',booking_reminders:'015_v618_reminders_reports.sql',refund_requests:'016_v619_refund_reconciliation.sql',refund_events:'016_v619_refund_reconciliation.sql',pet_taxi_requests:'018_v622_pet_taxi.sql',booking_intake_forms:'019_v625_pre_arrival.sql',booking_cancellation_requests:'020_v628_cancellation_review.sql'};
const expected=['password_reset_tokens','bookings','pets','promotions','account_notifications','payment_events','business_payment_settings','service_events','blocked_slots','staff_members','staff_shifts','booking_assignments','staff_assignment_events','booking_no_shows','booking_reminders','refund_requests','refund_events','pet_taxi_requests','booking_intake_forms','booking_cancellation_requests'];
if(!process.env.DATABASE_URL){console.error('Thiếu DATABASE_URL trong server/.env');process.exit(1)}
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{const r=await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])`,[expected]);const existing=new Set(r.rows.map(x=>x.table_name));const missing=expected.filter(n=>!existing.has(n));
 console.log('Database:',(await pool.query('SELECT current_database() AS name')).rows[0].name);
 console.log('Bảng bắt buộc:',expected.length,'| Đang có:',expected.length-missing.length,'| Thiếu:',missing.length);
 for(const m of missing) console.log('  THIẾU',m,'→',migrationLookup[m]||'009_v612_safe_upgrade.sql / các migration nền tảng');
 const petColumns=await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='pets'`);
 const pets=new Set(petColumns.rows.map(x=>x.column_name));
 if(!pets.has('archived_at')){
  console.log('  THIẾU pets.archived_at → chạy database/040_v676_pet_archive.sql sau khi sao lưu.');
  if(pets.has('is_archived')) console.log('  LƯU Ý: pets.is_archived là cột KHÁC, không thay thế archived_at.');
  process.exitCode=2;
 }else console.log('  OK: pets.archived_at đã tồn tại.');
 if(!pets.has('gender')){console.log('  THIẾU pets.gender → chạy database/041_v678_pet_gender.sql sau khi sao lưu.');process.exitCode=2;}else console.log('  OK: pets.gender đã tồn tại.');
 const retailColumns=await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='retail_orders'`);
 if(retailColumns.rows.length){
  const fields=new Set(retailColumns.rows.map(x=>x.column_name));
  if(!fields.has('delivery_eta')) console.log('  CẢNH BÁO: retail_orders.delivery_eta chưa có; kiểm tra migration 039 trước khi test giao hàng.');
 }
 console.log('\nĐây chỉ là chẩn đoán. SAO LƯU petday trước khi chạy migration, mở từng file SQL còn thiếu bằng pgAdmin và chạy đúng thứ tự.');
 if(missing.length)process.exitCode=2;
}catch(e){console.error('Không kiểm tra được schema:',e.code||e.message);process.exitCode=1;}finally{await pool.end();}

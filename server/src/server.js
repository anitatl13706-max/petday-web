import {serviceNotProvided,retailNotReceived,fullRefundDecisionIssue} from './fullRefundPolicy.mjs';
import {getAiReply,providerConfig} from './petdayAi.mjs';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import 'dotenv/config';
import express from 'express';
import {customerRetailCancellationIssue,adminRetailCancellationIssue} from './retailCancellationRules.mjs';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { z } from 'zod';
import { calculate, calculateExtras, addOns, services, slots, transitions, validSlot, validFutureDate, buildDailySlotPreview, servicesOverlap } from './rules.js';
import { taxiQuote, taxiTariffs } from './taxiRules.js';
import {retailTransitionIssue,retailTransferNoticeIssue} from './retailWorkflowRules.js';
import { missingServiceNames } from './schemaRules.js';
import { staffAssignmentIssue, careStepIssue, noShowIssue } from './staffRules.js';
import { tomorrowInVietnam, automaticRemindersEnabled } from './reminders.js';
import { refundEligibility, refundDecisionIssue, refundAmountIssue } from './refundRules.js';
import { intakeEditIssue,validEmergencyPhone } from './intakeRules.js';
import { cancellationRequestIssue,cancellationDecisionIssue } from './cancellationRules.js';

const { Pool }=pg;
const app=express();
const pool=new Pool({connectionString:process.env.DATABASE_URL});
const secret=process.env.JWT_SECRET;
if(!secret||secret.length<32||!process.env.DATABASE_URL){console.error('Missing DATABASE_URL or secure JWT_SECRET in server/.env');process.exit(1);}
const frontendOrigins=(process.env.FRONTEND_ORIGIN||'http://localhost:8444,http://localhost:8443,http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>cb(null,!origin||frontendOrigins.includes(origin))}));
app.use(express.json({limit:'50kb'}));
app.use('/uploads',express.static(fileURLToPath(new URL('../uploads/',import.meta.url)),{maxAge:'1d',index:false}));
const fail=(res,status,message)=>res.status(status).json({error:message});
const handler=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
function optionalAuth(req,res,next){const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(token){try{req.user=jwt.verify(token,secret)}catch{}}next();}
async function auth(req,res,next){try{const token=(req.headers.authorization||'').replace(/^Bearer /,'');const decoded=jwt.verify(token,secret);const found=await pool.query('SELECT id,role FROM users WHERE id=$1',[decoded.id]);if(!found.rowCount)return fail(res,401,'Phiên không còn hợp lệ.');req.user={id:found.rows[0].id,role:found.rows[0].role};next();}catch{return fail(res,401,'Vui lòng đăng nhập.');}}
function admin(req,res,next){pool.query('SELECT role FROM users WHERE id=$1',[req.user.id]).then(r=>r.rows[0]?.role==='admin'?next():fail(res,403,'Chỉ quản trị viên được phép.')).catch(next);}
// Staff can update only a booking currently assigned to their active staff profile.
// Admin operates the course-demo. Legacy staff accounts, if enabled later,
// must be linked to the exact assigned staff profile before recording care.
async function careOperator(req,res,next){
 if(req.user.role==='admin')return next();
 if(req.user.role!=='staff')return fail(res,403,'Không có quyền thao tác chăm sóc.');
 try{
  const q=await pool.query(`SELECT 1 FROM booking_assignments a
   JOIN staff_members m ON m.id=a.staff_id
   JOIN bookings b ON b.id=a.booking_id
   WHERE m.active=true AND b.code=$1 AND m.user_id=$2`,[req.params.code,req.user.id]);
  if(!q.rowCount)return fail(res,403,'Lịch không thuộc phân công của tài khoản nhân viên này.');
  next();
 }catch(e){next(e)}
}

const emailSchema=z.string().trim().email().max(200).transform(x=>x.toLowerCase());
const petSchema=z.object({name:z.string().trim().min(1).max(80),species:z.enum(['Chó','Mèo']),breed:z.string().trim().max(100).default(''),gender:z.enum(['Đực','Cái','Chưa xác định']).default('Chưa xác định'),age:z.coerce.number().min(0).max(40),weight:z.coerce.number().gt(0).max(80),notes:z.string().max(1000).default(''),photoUrl:z.union([z.literal(''),z.string().max(2000).refine(x=>(x.startsWith('https://')&&URL.canParse(x))||/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(x),'Chỉ chấp nhận ảnh HTTPS hoặc ảnh tải lên')]).default('')});

// Public PetDay AI. Never accepts account IDs or executes business mutations.
const aiRate=new Map();
app.get('/api/assistant/status',(req,res)=>{const config=providerConfig();res.json({enabled:Boolean(config.apiKey),provider:config.provider,model:config.model});});
app.post('/api/assistant/chat',handler(async(req,res)=>{
 const ip=req.ip||'unknown';const now=Date.now();
 if(aiRate.size>3000){for(const [k,v] of aiRate){if(now-v.start>60000)aiRate.delete(k);}}
 const rate=aiRate.get(ip)||{start:now,count:0};if(now-rate.start>60000){rate.start=now;rate.count=0;}
 rate.count++;aiRate.set(ip,rate);if(rate.count>12)return fail(res,429,'Bạn gửi quá nhanh. Vui lòng thử lại sau một phút.');
 const data=z.object({message:z.string().trim().min(1).max(700),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(700)})).max(24).optional()}).strict().parse(req.body);
 const result=await getAiReply(data);res.json(result);
}));

// Staff consultations: store customer requests, never claim a live chat session exists.
const consultationSchema=z.object({name:z.string().trim().min(2).max(120),email:emailSchema,question:z.string().trim().min(10).max(2000)});
app.post('/api/consultations',optionalAuth,handler(async(req,res)=>{const d=consultationSchema.parse(req.body);const result=await pool.query('INSERT INTO consultation_requests(customer_id,contact_name,contact_email,question) VALUES($1,$2,$3,$4) RETURNING id,created_at',[req.user?.id||null,d.name,d.email,d.question]);res.status(201).json({id:result.rows[0].id,message:'Yêu cầu đã được ghi nhận. Nhân viên sẽ xem khi có người trực.'});}));
app.get('/api/my/consultations',auth,handler(async(req,res)=>{const r=await pool.query('SELECT id,question,status,reply_text,responded_at,created_at FROM consultation_requests WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]);res.json(r.rows); }));
app.get('/api/admin/consultations',auth,admin,handler(async(req,res)=>{const result=await pool.query('SELECT id,contact_name,contact_email,question,status,reply_text,responded_at,created_at FROM consultation_requests ORDER BY created_at DESC LIMIT 100');res.json(result.rows);}));
app.patch('/api/admin/consultations/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({status:z.enum(['new','in_progress','closed']),replyText:z.string().trim().max(4000).optional()}).parse(req.body);
 if(d.status==='closed'&&!d.replyText)return fail(res,400,'Cần nhập nội dung phản hồi trước khi đóng yêu cầu.');
 const c=await pool.connect();try{await c.query('BEGIN');
 const result=await c.query("UPDATE consultation_requests SET status=$1,reply_text=COALESCE($2,reply_text),responded_at=CASE WHEN $2 IS NOT NULL AND $2<>'' THEN now() ELSE responded_at END WHERE id=$3 RETURNING id,customer_id,status,reply_text",[d.status,d.replyText||null,req.params.id]);
 if(!result.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy yêu cầu.');}
 if(d.replyText&&result.rows[0].customer_id)await notify(c,result.rows[0].customer_id,'PetDay đã phản hồi yêu cầu #'+req.params.id,'Mở Hỗ trợ & thông báo để xem phản hồi.');
 await c.query('COMMIT');res.json(result.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));

// V6.18: manually dispatch in-app reminders with idempotency; no unconfigured email/SMS claims.
// Business timezone is Asia/Ho_Chi_Minh. Reminders are generated for TOMORROW only.
function vietnamTomorrow(){return tomorrowInVietnam();}
async function reminderCandidates(db){return (await db.query(`SELECT b.id,b.code,b.customer_id,b.booking_date,b.slot,b.branch,b.pet_id,p.name AS pet_name
 FROM bookings b JOIN pets p ON p.id=b.pet_id
 WHERE b.booking_date=$1::date AND b.status='Đã xác nhận' AND NOT EXISTS
 (SELECT 1 FROM booking_reminders r WHERE r.booking_id=b.id AND r.kind='day_before')
 ORDER BY b.slot,b.id`,[vietnamTomorrow()])).rows;}
app.get('/api/admin/reminders/preview',auth,admin,handler(async(req,res)=>{
 const rows=await reminderCandidates(pool);res.json({forDate:vietnamTomorrow(),pending:rows.length,appointments:rows.map(x=>({code:x.code,slot:x.slot,branch:x.branch,petName:x.pet_name}))});
}));
// Shared dispatcher: manual and scheduled reminders use the same lock and idempotency rule.
async function dispatchTomorrowReminders(sentBy){
 const c=await pool.connect();try{await c.query('BEGIN');
 await c.query('SELECT pg_advisory_xact_lock(6182026,1)');
 const candidates=await reminderCandidates(c);let sent=0;
 for(const b of candidates){
  const latest=await c.query('SELECT status,booking_date FROM bookings WHERE id=$1 FOR UPDATE',[b.id]);
  if(!latest.rowCount||latest.rows[0].status!=='Đã xác nhận'||String(latest.rows[0].booking_date.toISOString?.().slice(0,10)||latest.rows[0].booking_date).slice(0,10)!==vietnamTomorrow())continue;
  const inserted=await c.query(`INSERT INTO booking_reminders(booking_id,kind,sent_by) VALUES($1,'day_before',$2) ON CONFLICT(booking_id,kind) DO NOTHING RETURNING id`,[b.id,sentBy]);
  if(!inserted.rowCount)continue;
  await notify(c,b.customer_id,'Nhắc lịch PetDay ngày mai · '+b.code,`Thú cưng ${b.pet_name} có lịch ${b.slot} tại ${b.branch}. Vui lòng đến đúng giờ hoặc liên hệ PetDay khi cần đổi lịch.`,b.code);sent++;
 }
 await c.query('COMMIT');return {sent,forDate:vietnamTomorrow(),channel:'in_app',note:'Chỉ lưu thông báo trong tài khoản; không gửi email/SMS.'};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
app.post('/api/admin/reminders/send',auth,admin,handler(async(req,res)=>{
 res.json(await dispatchTomorrowReminders(req.user.id));
}));
// Optional scheduler. An existing administrator is used as the auditable initiator because
// booking_reminders.sent_by is a NOT NULL foreign key to users. Disabled by default.
// A 60-minute interval + a DB uniqueness constraint prevents repeated deliveries,
// even if the server restarts or multiple instances run concurrently.
const autoRemindersEnabled=automaticRemindersEnabled(process.env.PETDAY_AUTO_REMINDERS);
async function scheduledReminderCheck(){
 try{
  const admins=await pool.query("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
  if(!admins.rowCount){console.warn('[reminders] No admin account; skipped scheduler');return;}
  const result=await dispatchTomorrowReminders(admins.rows[0].id);
  if(result.sent)console.log('[reminders] Created '+result.sent+' in-app reminders for '+result.forDate);
 }catch(e){console.error('[reminders] Scheduler error:',e.message);}
}
app.get('/api/health',handler(async(req,res)=>{await pool.query('SELECT 1');res.json({ok:true,mode:'postgresql'});}));

// V6.43: read-only diagnostics for release-specific tables. No secrets and no mutation.
app.get('/api/health/workflows',handler(async(req,res)=>{
 const required={
  'service_price_settings':['name','base_price'],
  'retail_products':['id','name','price','stock'],
  'retail_orders':['id','code','customer_id','status','payment_method','payment_status'],
  'retail_order_items':['id','order_id','product_id','quantity','unit_price'],
  'retail_order_events':['id','order_id','event_type'],
  'bank_transfer_notices':['booking_id','customer_reference','created_at'],
  'reviews':['booking_id','moderation_status'],
  'staff_members':['id','user_id'],
 };
 const names=Object.keys(required);
 const r=await pool.query(`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[])`,[names]);
 const map=new Map();for(const row of r.rows){if(!map.has(row.table_name))map.set(row.table_name,new Set());map.get(row.table_name).add(row.column_name)}
 const missing=Object.entries(required).flatMap(([table,columns])=>columns.filter(column=>!map.get(table)?.has(column)).map(column=>({table,column})));
 res.status(missing.length?503:200).json({ok:missing.length===0,version:'V6.43',workflowSchemaReady:missing.length===0,missing,
  migrationHint:missing.length?'Đối chiếu các file 021–025 đúng thứ tự, sau khi sao lưu; không chạy lại 001–020.':'Các bảng/cột chính cho nghiệp vụ nâng cao đã có. Vẫn phải test API thực tế.'});
}));

// Read-only configuration diagnostic; does not reveal passwords, tokens or bank details.
app.get('/api/health/features',handler(async(req,res)=>{
 await pool.query('SELECT 1');
 const smtp=['SMTP_HOST','SMTP_USER','SMTP_PASS','RESET_BASE_URL'].every(k=>Boolean(process.env[k]?.trim()));
 res.json({ok:true,emailRecovery:{configured:smtp,delivery:'smtp',note:smtp?'Có cấu hình SMTP; cần gửi thư thử để xác minh thực tế.':'Chưa cấu hình SMTP; xem server/.env.example.'},petPhotos:{enabled:true,maxBytes:5*1024*1024,formats:['JPEG','PNG','WebP'],urlPrefix:'/uploads/'},schemaCheck:'/api/health/schema'});
}));


// Non-sensitive database readiness: identify missing migrations without revealing user data or credentials.
// Diagnose the exact cause of 8-package booking errors without changing customer records.
app.get('/api/health/services',handler(async(req,res)=>{
 const q=await pool.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.bookings'::regclass AND conname='bookings_service_check'");
 const def=q.rows[0]?.definition||'';const missing=missingServiceNames(def,Object.keys(services));
 res.status(missing.length?503:200).json({ok:missing.length===0,serviceCount:Object.keys(services).length,missingServiceNames:missing,help:missing.length?'Sao lưu PostgreSQL và đối chiếu SQL 022_v638_service_packages.sql; không chạy lại SQL nền tảng.':'Cả 8 tên gói đã có trong ràng buộc bookings_service_check. Kiểm thử API đặt lịch và giá sau bước này.'});
}));
app.get('/api/health/schema',handler(async(req,res)=>{
 const expected={password_reset_tokens:['id','user_id','token_hash','expires_at','used_at'],users:['id','email','full_name','password_hash','role'],pets:['id','owner_id','name','species','breed','age','weight','notes','photo_url'],bookings:['id','code','customer_id','pet_id','service','branch','booking_date','slot','status','payment_status','payment_method','promo_code','line_items','total','created_at'],care_records:['booking_id','notes','care_date'],reviews:['booking_id','rating','comment','moderation_status'],consultation_requests:['id','customer_id','reply_text'],booking_reschedule_requests:['id','status'],promotions:['code','active'],payment_events:['booking_id','admin_id','new_status'],account_notifications:['user_id','title','body','read_at'],business_payment_settings:['id','bank_name','account_number','account_holder'],blocked_slots:['id','branch','booking_date','slot','reason'],staff_members:['id','full_name','branch','active','user_id'],staff_shifts:['id','staff_id','shift_date','slot'],booking_assignments:['booking_id','staff_id','booking_date','slot'],staff_assignment_events:['booking_id','staff_id','action','changed_by'],booking_no_shows:['booking_id','recorded_by','reason','recorded_at'],booking_reminders:['booking_id','kind','sent_by'],refund_requests:['id','booking_id','customer_id','status','amount','reason'],refund_events:['id','refund_id','actor_id','new_status'],service_events:['id','booking_id','event_type','note','created_by','created_at','photo_url'],pet_taxi_requests:['id','booking_id','zone','pickup_address','contact_phone','fee','status'],booking_intake_forms:['booking_id','emergency_phone','health_alerts','care_instructions','owner_confirmed','updated_at'],booking_cancellation_requests:['id','booking_id','customer_id','reason','status','admin_note','resolved_at']};
 const names=Object.keys(expected);
 const q=await pool.query('SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=ANY($2::text[])',['public',names]);
 const present=new Map();for(const row of q.rows){if(!present.has(row.table_name))present.set(row.table_name,new Set());present.get(row.table_name).add(row.column_name);}
 const missing=Object.entries(expected).flatMap(([table,cols])=>cols.filter(c=>!present.get(table)?.has(c)).map(column=>({table,column})));
 const migrationHints={reviews:'021_v637_review_moderation.sql',password_reset_tokens:'009_v612_safe_upgrade.sql',pets:'003_support_pets.sql / 009_v612_safe_upgrade.sql',bookings:'009_v612_safe_upgrade.sql',consultation_requests:'009_v612_safe_upgrade.sql',booking_reschedule_requests:'009_v612_safe_upgrade.sql',promotions:'009_v612_safe_upgrade.sql',payment_events:'009_v612_safe_upgrade.sql',account_notifications:'009_v612_safe_upgrade.sql',business_payment_settings:'010_v613_payment_settings.sql',service_events:'011_v614_service_timeline.sql / 015_v618_reminders_reports.sql',blocked_slots:'012_v615_capacity_management.sql',staff_members:'013_v616_staff_dispatch.sql / 017_v620_staff_accounts.sql',staff_shifts:'013_v616_staff_dispatch.sql',booking_assignments:'013_v616_staff_dispatch.sql',staff_assignment_events:'013_v616_staff_dispatch.sql',booking_no_shows:'014_v617_no_show.sql',booking_reminders:'015_v618_reminders_reports.sql',refund_requests:'016_v619_refund_reconciliation.sql',refund_events:'016_v619_refund_reconciliation.sql',pet_taxi_requests:'018_v622_pet_taxi.sql',booking_intake_forms:'019_v625_pre_arrival.sql',booking_cancellation_requests:'020_v628_cancellation_review.sql'};
 const suggestedMigrations=[...new Set(missing.map(x=>migrationHints[x.table]).filter(Boolean).flatMap(x=>x.split(' / ')))];
 res.status(missing.length?503:200).json({ok:missing.length===0,mode:'postgresql',schemaReady:missing.length===0,missing,suggestedMigrations,help:missing.length?'Sao lưu database, kiểm tra trạng thái các migration, chạy các file còn thiếu theo thứ tự; tuyệt đối không chạy lại file gây xung đột.':'Schema đã có các cột quan trọng.'});
}));
// Admin-only operational snapshot; all values queried from real records, no fabricated dashboard numbers.
app.get('/api/admin/overview',auth,admin,handler(async(req,res)=>{
 const [bookings,consultations,changes]=await Promise.all([
  pool.query("SELECT count(*)::int total,count(*) FILTER(WHERE status='Đang chờ xác nhận')::int pending,count(*) FILTER(WHERE status='Đã xác nhận')::int confirmed,count(*) FILTER(WHERE status='Đang thực hiện')::int in_progress,count(*) FILTER(WHERE status='Hoàn tất')::int completed,count(*) FILTER(WHERE payment_status='Chưa thanh toán' AND status<>'Đã hủy')::int unpaid,coalesce(sum(total) FILTER(WHERE payment_status='Đã thanh toán'),0)::bigint AS collected FROM bookings"),
  pool.query("SELECT count(*) FILTER(WHERE status<>'closed')::int open FROM consultation_requests"),
  pool.query("SELECT count(*) FILTER(WHERE status='pending')::int pending FROM booking_reschedule_requests")
 ]);
 res.json({bookings:bookings.rows[0],consultations:consultations.rows[0],reschedules:changes.rows[0],generatedAt:new Date().toISOString()});
}));


// User inbox: only owner can read/mark. No claims of push delivery.
app.get('/api/my/notifications',auth,handler(async(req,res)=>{
 const q=await pool.query('SELECT id,title,body,booking_code AS "bookingCode",read_at AS "readAt",created_at AS "createdAt" FROM account_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 70',[req.user.id]);res.json(q.rows);
}));
app.patch('/api/my/notifications/:id/read',auth,handler(async(req,res)=>{
 const q=await pool.query('UPDATE account_notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND user_id=$2 RETURNING id,read_at AS "readAt"',[req.params.id,req.user.id]);if(!q.rowCount)return fail(res,404,'Không tìm thấy thông báo.');res.json(q.rows[0]);
}));
// Back-office promotional campaigns: no invented active coupons; created by a real admin.
app.get('/api/admin/promotions',auth,admin,handler(async(req,res)=>{
 const q=await pool.query('SELECT id,code,discount_type,discount_value,max_discount,min_order,service_name,starts_at,ends_at,max_uses,max_per_customer,active FROM promotions ORDER BY id DESC LIMIT 100');res.json(q.rows);
}));
app.post('/api/admin/promotions',auth,admin,handler(async(req,res)=>{
 const d=z.object({code:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/),discountType:z.enum(['fixed','percent']),discountValue:z.coerce.number().int().positive(),minOrder:z.coerce.number().int().min(0).default(0),maxDiscount:z.coerce.number().int().positive().nullable().optional(),maxUses:z.coerce.number().int().positive().nullable().optional(),maxPerCustomer:z.coerce.number().int().positive().default(1),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true})}).parse(req.body);
 if(d.discountType==='percent'&&d.discountValue>100)return fail(res,422,'Giảm theo % tối đa 100%.');if(new Date(d.endsAt)<=new Date(d.startsAt))return fail(res,422,'Thời gian kết thúc phải sau thời gian bắt đầu.');
 try{const q=await pool.query('INSERT INTO promotions(code,discount_type,discount_value,min_order,max_discount,max_uses,max_per_customer,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[d.code,d.discountType,d.discountValue,d.minOrder,d.maxDiscount||null,d.maxUses||null,d.maxPerCustomer,d.startsAt,d.endsAt]);res.status(201).json(q.rows[0]);}catch(e){if(e.code==='23505')return fail(res,409,'Mã ưu đãi đã tồn tại.');throw e;}
}));
app.patch('/api/admin/promotions/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({active:z.boolean()}).parse(req.body);const q=await pool.query('UPDATE promotions SET active=$1 WHERE id=$2 RETURNING id,code,active',[d.active,req.params.id]);if(!q.rowCount)return fail(res,404,'Không thấy chiến dịch.');res.json(q.rows[0]);
}));
async function notify(c,userId,title,body,bookingCode=null){await c.query('INSERT INTO account_notifications(user_id,title,body,booking_code) VALUES($1,$2,$3,$4)',[userId,title,body,bookingCode]);}

app.post('/api/auth/register',handler(async(req,res)=>{const input=z.object({email:emailSchema,password:z.string().min(8).max(128),fullName:z.string().trim().min(2).max(120)}).parse(req.body);const hash=await bcrypt.hash(input.password,12);try{const r=await pool.query('INSERT INTO users(email,full_name,password_hash) VALUES($1,$2,$3) RETURNING id,email,full_name,role',[input.email,input.fullName,hash]);res.status(201).json({message:'Đã đăng ký',user:r.rows[0]});}catch(e){if(e.code==='23505')return fail(res,409,'Email đã được sử dụng.');throw e;}}));
app.post('/api/auth/login',handler(async(req,res)=>{const input=z.object({email:emailSchema,password:z.string()}).parse(req.body);const r=await pool.query('SELECT * FROM users WHERE email=$1',[input.email]);const u=r.rows[0];if(!u||!await bcrypt.compare(input.password,u.password_hash))return fail(res,401,'Email hoặc mật khẩu không đúng.');const token=jwt.sign({id:u.id,role:u.role},secret,{expiresIn:'8h'});res.json({token,user:{id:u.id,email:u.email,fullName:u.full_name,role:u.role}});}));
// Password recovery: always respond generically; never expose tokens to the browser.
const resetLimiter=new Map();
app.post('/api/auth/forgot-password',handler(async(req,res)=>{
 const {email}=z.object({email:emailSchema}).parse(req.body);const ip=req.ip||'unknown';const key=ip+':'+email;
 const now=Date.now();const rec=resetLimiter.get(key)||{count:0,until:now+15*60_000};if(rec.until<now){rec.count=0;rec.until=now+15*60_000;}rec.count++;resetLimiter.set(key,rec);
 if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS||!process.env.RESET_BASE_URL)return fail(res,503,'Chức năng khôi phục qua email chưa được cấu hình trên máy chủ.');
 const response={message:'Nếu email đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.'};
 if(rec.count>4)return res.json(response);
 const user=await pool.query('SELECT id,email FROM users WHERE email=$1',[email]);
 if(user.rowCount && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.RESET_BASE_URL){
  const raw=randomBytes(32).toString('hex');const hash=createHash('sha256').update(raw).digest('hex');
  await pool.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[user.rows[0].id,hash]);
  const {default:nodemailer}=await import('nodemailer');const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==='465',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  const link=new URL(process.env.RESET_BASE_URL);link.searchParams.set('reset_token',raw);
  try{await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:'Đặt lại mật khẩu PetDay',text:'Bạn đã yêu cầu đặt lại mật khẩu. Liên kết dùng một lần, hết hạn sau 30 phút: '+link.toString()+'\nNếu không yêu cầu, hãy bỏ qua email này.'});}
  catch(e){await pool.query('DELETE FROM password_reset_tokens WHERE token_hash=$1',[hash]);console.error('[smtp-delivery] Email delivery failed:',e.code||e.message);return fail(res,503,'Máy chủ chưa gửi được email khôi phục. Kiểm tra cấu hình SMTP trong server/.env và terminal API.');}
 }
 res.json(response);
}));
app.post('/api/auth/reset-password',handler(async(req,res)=>{
 const d=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(8).max(128)}).parse(req.body);
 const hash=createHash('sha256').update(d.token).digest('hex');const c=await pool.connect();try{await c.query('BEGIN');
  const r=await c.query('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[hash]);
  if(!r.rowCount){await c.query('ROLLBACK');return fail(res,400,'Liên kết không hợp lệ hoặc đã hết hạn.');}
  await c.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(d.password,12),r.rows[0].user_id]);
  await c.query('UPDATE password_reset_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[r.rows[0].user_id]);await c.query('COMMIT');res.json({message:'Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.'});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.get('/api/me',auth,handler(async(req,res)=>{const r=await pool.query('SELECT id,email,full_name,role FROM users WHERE id=$1',[req.user.id]);if(!r.rows.length)return fail(res,401,'Phiên đăng nhập không hợp lệ.');res.json(r.rows[0]);}));
// Customer account: update only self, never accept a role in the request.
app.patch('/api/me',auth,handler(async(req,res)=>{
 const d=z.object({fullName:z.string().trim().min(2).max(120)}).strict().parse(req.body);
 const r=await pool.query('UPDATE users SET full_name=$1 WHERE id=$2 RETURNING id,email,full_name,role',[d.fullName,req.user.id]);
 res.json(r.rows[0]);
}));
// V6.42: published price overrides are loaded from PostgreSQL before quoting or booking.
// Package identity/eligibility/capacity remains code-defined; the admin cannot bypass these rules.
async function refreshPublishedServicePrices(){
 const r=await pool.query('SELECT name,base_price,is_active FROM service_price_settings');
 for(const name of Object.keys(services)){ services[name].active=false; }
 for(const row of r.rows){if(services[row.name]){services[row.name].base=Number(row.base_price);services[row.name].active=row.is_active===true;}}
}
app.use(['/api/quote','/api/bookings','/api/catalog','/api/public/services','/api/promotions/verify','/api/availability'],(req,res,next)=>{
 refreshPublishedServicePrices().then(()=>next()).catch(e=>{if(e.code==='42P01')return fail(res,503,'Chưa chạy SQL 025 để sử dụng bảng giá mới.');if(e.code==='42703')return fail(res,503,'Chưa chạy SQL 026 để sử dụng trạng thái mở/tạm ngừng gói dịch vụ.');next(e);});
});
app.get('/api/admin/services/prices',auth,admin,handler(async(req,res)=>{
 await refreshPublishedServicePrices();
 const rows=await pool.query('SELECT name,base_price,is_active,updated_at FROM service_price_settings ORDER BY name');
 res.json(rows.rows.map(x=>({name:x.name,basePrice:Number(x.base_price),active:x.is_active,updatedAt:x.updated_at,category:services[x.name]?.category,duration:services[x.name]?.duration,allowedSpecies:services[x.name]?.species})));
}));
app.put('/api/admin/services/prices/:name',auth,admin,handler(async(req,res)=>{
 const name=req.params.name;
 if(!Object.hasOwn(services,name))return fail(res,404,'Gói dịch vụ không thuộc danh mục 8 gói đang hỗ trợ.');
 const d=z.object({basePrice:z.number().int().min(20000).max(5000000)}).strict().parse(req.body);
 const q=await pool.query('UPDATE service_price_settings SET base_price=$1,updated_by=$2,updated_at=now() WHERE name=$3 RETURNING name,base_price,updated_at',[d.basePrice,req.user.id,name]);
 if(!q.rowCount)return fail(res,409,'Thiếu gói trong bảng giá; kiểm tra SQL 025.');
 services[name].base=d.basePrice;
 res.json({name,basePrice:d.basePrice,updatedAt:q.rows[0].updated_at});
}));
// V6.44: allow the administrator to pause/reopen online sale of the eight supported packages.
// Existing bookings are historical records and are never rewritten by this operation.
app.patch('/api/admin/services/:name/availability',auth,admin,handler(async(req,res)=>{
 const name=req.params.name;
 if(!Object.hasOwn(services,name))return fail(res,404,'Gói dịch vụ không được hỗ trợ.');
 const d=z.object({active:z.boolean()}).strict().parse(req.body);
 const r=await pool.query('UPDATE service_price_settings SET is_active=$1,updated_by=$2,updated_at=now() WHERE name=$3 RETURNING is_active,updated_at',[d.active,req.user.id,name]);
 if(!r.rowCount)return fail(res,409,'Thiếu dữ liệu bảng giá. Hãy kiểm tra SQL 025 và 026.');
 services[name].active=d.active;
 res.json({name,active:r.rows[0].is_active,updatedAt:r.rows[0].updated_at});
}));
// Server-authoritative quote: show real calculation before submitting a booking.
app.get('/api/quote',auth,handler(async(req,res)=>{
 const d=z.object({petId:z.coerce.number().int().positive(),service:z.string(),addOns:z.string().default(''),taxiZone:z.enum(['none','nearby','extended']).default('none'),retail:z.string().max(300).default('[]')}).parse(req.query);
 if(!services[d.service])return fail(res,400,'Dịch vụ không tồn tại.');
 if(services[d.service].active===false)return fail(res,409,'Gói dịch vụ đã tạm ngừng nhận lịch. Vui lòng chọn gói khác.');
 const r=await pool.query('SELECT species,weight,age FROM pets WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL',[d.petId,req.user.id]);
 if(!r.rowCount)return fail(res,404,'Không tìm thấy thú cưng thuộc tài khoản.');
 try{const quote=calculate(d.service,r.rows[0]);const extra=calculateExtras(d.service,d.addOns?d.addOns.split(','):[]);quote.lines.push(...extra.lines);quote.total+=extra.total;if(d.taxiZone!=='none'){const fare=taxiTariffs[d.taxiZone];quote.total+=fare.fee;quote.lines.push({type:'taxi',label:'Pet Taxi · '+fare.label,amount:fare.fee});}const retail=await quoteRetail(pool,retailSelectionSchema.parse(JSON.parse(d.retail)));quote.total+=retail.total;quote.lines.push(...retail.lines);res.json({...quote,service:d.service,currency:'VND',notice:'Báo giá theo hồ sơ hiện tại; kiểm tra lại khi đặt lịch.'});}
 catch{return fail(res,422,'Thú cưng không đủ điều kiện cho dịch vụ.');}
}));
// V6.40: Customer-submitted transfer notice is NOT evidence of settlement.
// Database enforces one notice per booking, and every read is scoped by role.
app.get('/api/my/transfer-notices',auth,handler(async(req,res)=>{
 const q=await pool.query(`SELECT n.booking_id AS "bookingId",b.code,n.customer_reference AS "customerReference",n.customer_note AS "customerNote",n.sender_bank AS "senderBank",n.sender_name AS "senderName",n.created_at AS "createdAt",n.updated_at AS "updatedAt",b.payment_status AS "paymentStatus" FROM bank_transfer_notices n JOIN bookings b ON b.id=n.booking_id WHERE b.customer_id=$1 ORDER BY n.updated_at DESC LIMIT 150`,[req.user.id]);res.json(q.rows);
}));
app.post('/api/bookings/:code/transfer-notice',auth,handler(async(req,res)=>{
 const d=z.object({customerReference:z.string().trim().max(100).default(''),customerNote:z.string().trim().max(300).default(''),senderBank:z.string().trim().min(2).max(100),senderName:z.string().trim().min(2).max(120)}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const q=await c.query('SELECT id,customer_id,code,payment_method,payment_status,status,total FROM bookings WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
  if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch của bạn.');}
  const b=q.rows[0];if(b.payment_method!=='bank_transfer'||b.payment_status!=='Chưa thanh toán'||b.status==='Đã hủy'){
   await c.query('ROLLBACK');return fail(res,409,'Chỉ có thể báo đã chuyển cho lịch chuyển khoản chưa được xác nhận và chưa hủy.');
  }
  await c.query(`INSERT INTO bank_transfer_notices(booking_id,customer_reference,customer_note,sender_bank,sender_name)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(booking_id) DO UPDATE SET customer_reference=EXCLUDED.customer_reference,customer_note=EXCLUDED.customer_note,sender_bank=EXCLUDED.sender_bank,sender_name=EXCLUDED.sender_name,updated_at=now()`,[b.id,d.customerReference||null,d.customerNote||null,d.senderBank,d.senderName]);
  await c.query('COMMIT');res.json({ok:true,message:'Đã ghi nhận thông báo của bạn. Trạng thái vẫn là Chưa thanh toán cho đến khi PetDay kiểm tra tiền thực nhận.'});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.get('/api/admin/transfer-notices',auth,admin,handler(async(req,res)=>{
 const q=await pool.query(`SELECT b.code,b.total,b.payment_status AS "paymentStatus",b.status AS "bookingStatus",u.full_name AS "customerName",n.customer_reference AS "customerReference",n.customer_note AS "customerNote",n.sender_bank AS "senderBank",n.sender_name AS "senderName",n.created_at AS "createdAt",n.updated_at AS "updatedAt"
 FROM bank_transfer_notices n JOIN bookings b ON b.id=n.booking_id JOIN users u ON u.id=b.customer_id ORDER BY (b.payment_status='Chưa thanh toán') DESC,n.updated_at DESC LIMIT 150`);res.json(q.rows);
}));
// Staff must still inspect the bank statement and record its REAL reference via existing /api/admin/bookings/:code/payment.
// Bank details are visible only when supplied by owner in server configuration.
app.get('/api/payment/options',handler(async(req,res)=>{
 const recipient=await paymentRecipient();const demo=process.env.PETDAY_DEMO_PAYMENT==='true';const bank=recipient?.bankName,account=recipient?.accountNumber,holder=recipient?.accountHolder;
 res.json({cash:{enabled:true,label:'Tiền mặt tại cơ sở'},bankTransfer:{enabled:Boolean(bank&&account&&holder),demo,bankName:bank&&account&&holder?bank:null,accountNumber:bank&&account&&holder?account:null,accountHolder:bank&&account&&holder?holder:null,note:demo?'Thanh toán thử nghiệm. Không chuyển tiền thật và không có giao dịch ngân hàng.':'Chuyển khoản chỉ được xác nhận sau khi nhân viên đối chiếu giao dịch thực nhận.'},vnpay:{enabled:false,note:'Chưa tích hợp VNPAY Sandbox và xác thực IPN.'}});
}));

// Bank recipient configured by an authenticated administrator. Do not infer settlement from customer selection.
async function paymentRecipient(){
 if(process.env.PETDAY_DEMO_PAYMENT==='true')return {bankName:'PetDay · Tài khoản thử nghiệm',accountNumber:'KHONG-CHUYEN-TIEN',accountHolder:'PETDAY'};
 const q=await pool.query('SELECT bank_name,account_number,account_holder FROM business_payment_settings WHERE id=1');
 if(q.rowCount)return {bankName:q.rows[0].bank_name,accountNumber:q.rows[0].account_number,accountHolder:q.rows[0].account_holder};
 const [bankName,accountNumber,accountHolder]=[process.env.PETDAY_BANK_NAME?.trim(),process.env.PETDAY_BANK_ACCOUNT?.trim(),process.env.PETDAY_BANK_HOLDER?.trim()];
 return bankName&&accountNumber&&accountHolder?{bankName,accountNumber,accountHolder}:null;
}
app.get('/api/admin/payment-settings',auth,admin,handler(async(req,res)=>res.json({bankTransfer:await paymentRecipient()})));
app.put('/api/admin/payment-settings',auth,admin,handler(async(req,res)=>{
 if(process.env.PETDAY_DEMO_PAYMENT==='true')return fail(res,409,'Đang bật chế độ thanh toán mô phỏng. Tắt PETDAY_DEMO_PAYMENT trước khi lưu tài khoản thật.');
 const d=z.object({bankName:z.string().trim().min(2).max(100),accountNumber:z.string().trim().regex(/^[0-9]{6,25}$/),accountHolder:z.string().trim().min(3).max(120)}).strict().parse(req.body);
 const r=await pool.query('INSERT INTO business_payment_settings(id,bank_name,account_number,account_holder,updated_by) VALUES (1,$1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET bank_name=EXCLUDED.bank_name,account_number=EXCLUDED.account_number,account_holder=EXCLUDED.account_holder,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING bank_name AS "bankName",account_number AS "accountNumber",account_holder AS "accountHolder"',[d.bankName,d.accountNumber,d.accountHolder,req.user.id]);
 res.json({bankTransfer:r.rows[0]});
}));
// A customer may change their payment choice before the payment is recorded, preserving the booked price.
app.patch('/api/bookings/:code/payment-method',auth,handler(async(req,res)=>{
 const {paymentMethod}=z.object({paymentMethod:z.enum(['cash','bank_transfer'])}).strict().parse(req.body);
 if(paymentMethod==='bank_transfer'&&!await paymentRecipient())return fail(res,422,'Chưa có tài khoản nhận chuyển khoản. Hãy chọn tiền mặt hoặc liên hệ PetDay.');
 const c=await pool.connect();try{await c.query('BEGIN');
  const found=await c.query('SELECT id,payment_method,payment_status,status FROM bookings WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
  if(!found.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch của bạn.');}
  const b=found.rows[0];if(b.payment_status!=='Chưa thanh toán'||b.status==='Đã hủy'||b.status==='Hoàn tất') {await c.query('ROLLBACK');return fail(res,409,'Lịch đã thanh toán, hủy hoặc hoàn tất nên không thể đổi phương thức.');}
  await c.query('UPDATE bookings SET payment_method=$1 WHERE id=$2',[paymentMethod,b.id]);
  await notify(c,req.user.id,'Đã thay đổi phương thức thanh toán '+req.params.code,paymentMethod==='cash'?'Thanh toán tại cơ sở khi sử dụng dịch vụ.':'Chuyển khoản theo mã lịch, chờ nhân viên đối soát.',req.params.code);
  await c.query('COMMIT');res.json({ok:true,paymentMethod});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Authenticated password change works even when SMTP has not been configured.
app.post('/api/me/change-password',auth,handler(async(req,res)=>{
 const d=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(8).max(128)}).strict().parse(req.body);
 if(d.currentPassword===d.newPassword)return fail(res,422,'Mật khẩu mới phải khác mật khẩu hiện tại.');
 const q=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);
 if(!q.rowCount||!await bcrypt.compare(d.currentPassword,q.rows[0].password_hash))return fail(res,401,'Mật khẩu hiện tại không đúng.');
 await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(d.newPassword,12),req.user.id]);
 res.json({message:'Đổi mật khẩu thành công. Hãy sử dụng mật khẩu mới ở lần đăng nhập tiếp theo.'});
}));
// Promotions: backend validation never trusts displayed discounts.
app.get('/api/promotions/verify',auth,handler(async(req,res)=>{
 const d=z.object({code:z.string().trim().min(1).max(32),petId:z.coerce.number().int().positive(),service:z.string(),addOns:z.string().default(''),taxiZone:z.enum(['none','nearby','extended']).default('none'),retail:z.string().max(300).default('[]')}).parse(req.query);
 if(!services[d.service])return fail(res,422,'Dịch vụ không hợp lệ.');
 if(services[d.service].active===false)return fail(res,409,'Gói dịch vụ đã tạm ngừng nhận lịch.');
 const p=await pool.query('SELECT species,weight,age FROM pets WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL',[d.petId,req.user.id]);if(!p.rowCount)return fail(res,404,'Không tìm thấy thú cưng.');
 const quote=calculate(d.service,p.rows[0]);const extra=calculateExtras(d.service,d.addOns?d.addOns.split(','):[]);quote.total+=extra.total;quote.lines.push(...extra.lines);if(d.taxiZone!=='none'){const fare=taxiTariffs[d.taxiZone];quote.total+=fare.fee;quote.lines.push({type:'taxi',label:'Pet Taxi · '+fare.label,amount:fare.fee});}const retail=await quoteRetail(pool,retailSelectionSchema.parse(JSON.parse(d.retail)));quote.total+=retail.total;quote.lines.push(...retail.lines);const code=d.code.toUpperCase();
 const r=await pool.query('SELECT * FROM promotions WHERE code=$1 AND active=true AND starts_at<=now() AND ends_at>now()',[code]);if(!r.rowCount)return fail(res,422,'Mã không tồn tại hoặc đã hết hạn.');const o=r.rows[0];
 if(quote.total<Number(o.min_order)||o.service_name&&o.service_name!==d.service)return fail(res,422,'Mã không áp dụng cho dịch vụ hoặc số tiền hiện tại.');
 const count=await pool.query("SELECT count(*)::int AS all_count,count(*) FILTER (WHERE customer_id=$2)::int AS personal_count FROM bookings WHERE promo_code=$1 AND status <> 'Đã hủy'",[code,req.user.id]);
 if(o.max_uses!==null&&count.rows[0].all_count>=o.max_uses||count.rows[0].personal_count>=o.max_per_customer)return fail(res,422,'Mã đã hết lượt sử dụng.');
 let discount=o.discount_type==='percent'?Math.floor(quote.total*Number(o.discount_value)/100):Number(o.discount_value);if(o.max_discount!==null)discount=Math.min(discount,Number(o.max_discount));discount=Math.min(discount,quote.total);
 res.json({code,subtotal:quote.total,discount,total:quote.total-discount,notice:'Hệ thống kiểm tra lại mã khi xác nhận lịch.'});
}));

// Authenticated upload. Do not trust filename, extension or Content-Type alone.
app.post('/api/pets/photo',auth,express.raw({type:['image/jpeg','image/png','image/webp'],limit:'5mb'}),handler(async(req,res)=>{
 const buf=req.body;if(!Buffer.isBuffer(buf)||!buf.length)return fail(res,400,'Không đọc được ảnh. Chọn file JPG/PNG/WebP, tối đa 5 MB.');
 const jpg=buf.length>3&&buf[0]===255&&buf[1]===216&&buf[2]===255;
 const png=buf.length>8&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp=buf.length>12&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP';
 if(!jpg&&!png&&!webp)return fail(res,400,'File không phải ảnh JPG, PNG hoặc WebP hợp lệ.');
 const ext=jpg?'jpg':png?'png':'webp';const filename=randomUUID()+'.'+ext;
 const folder=new URL('../uploads/',import.meta.url);await mkdir(folder,{recursive:true});await writeFile(new URL(filename,folder),buf,{flag:'wx'});
 res.status(201).json({url:'/uploads/'+filename});
}));
app.get('/api/pets',auth,handler(async(req,res)=>{const r=await pool.query('SELECT id,name,species,breed,gender,age,weight,notes,photo_url AS "photoUrl" FROM pets WHERE owner_id=$1 AND archived_at IS NULL ORDER BY id DESC',[req.user.id]);res.json(r.rows);}));
app.post('/api/pets',auth,handler(async(req,res)=>{const p=petSchema.parse(req.body);const r=await pool.query('INSERT INTO pets(owner_id,name,species,breed,gender,age,weight,notes,photo_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[req.user.id,p.name,p.species,p.breed,p.gender,p.age,p.weight,p.notes,p.photoUrl]);res.status(201).json(r.rows[0]);}));
app.put('/api/pets/:id',auth,handler(async(req,res)=>{const p=petSchema.parse(req.body);const r=await pool.query('UPDATE pets SET name=$1,species=$2,breed=$3,gender=$4,age=$5,weight=$6,notes=$7,photo_url=$8 WHERE id=$9 AND owner_id=$10 AND archived_at IS NULL RETURNING *',[p.name,p.species,p.breed,p.gender,p.age,p.weight,p.notes,p.photoUrl,req.params.id,req.user.id]);if(!r.rows.length)return fail(res,404,'Không tìm thấy thú cưng.');res.json(r.rows[0]);}));
// V6 public service discovery (informational catalog, not proof of actual live slots).
app.get('/api/public/services',handler(async(req,res)=>{await refreshPublishedServicePrices();
 const q=String(req.query.q||'').trim().toLocaleLowerCase('vi');
 const category=String(req.query.category||'').trim().toLocaleLowerCase('vi');
 const items=Object.entries(services).filter(([,v])=>v.active!==false).map(([name,v])=>({name,category:v.category,basePrice:v.base??v.price??null,description:v.description||'',allowedSpecies:v.species||[],durationMinutes:v.duration,capacityUnits:v.units}));
 res.json(items.filter(x=>(!q||(x.name+' '+x.description).toLocaleLowerCase('vi').includes(q))&&(!category||x.category.toLocaleLowerCase('vi')===category)));
}));
// V6 publicly visible approved completed-booking reviews. Do not fabricate reviews.
app.get('/api/public/reviews',handler(async(req,res)=>{
 const rows=await pool.query("SELECT r.rating,r.comment,r.created_at, b.service FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.status='Hoàn tất' AND r.moderation_status='approved' ORDER BY r.created_at DESC LIMIT 50");
 res.json(rows.rows);
}));
// CRM read-only view: only Admin can browse customer contacts and booking history summaries.
app.get('/api/admin/customers',auth,admin,handler(async(req,res)=>{
 const search=String(req.query.q||'').trim().slice(0,100);
 const rows=await pool.query(`SELECT u.id,u.full_name AS "fullName",u.email,u.created_at AS "createdAt",
 count(DISTINCT p.id)::int AS "petCount",count(DISTINCT b.id)::int AS "bookingCount",
 0::bigint AS "recordedPaid"
 FROM users u LEFT JOIN pets p ON p.owner_id=u.id LEFT JOIN bookings b ON b.customer_id=u.id
 WHERE u.role='customer' AND ($1='' OR u.full_name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%')
 GROUP BY u.id ORDER BY u.created_at DESC LIMIT 100`,[search]);
 res.json(rows.rows);
}));
app.get('/api/admin/reviews',auth,admin,handler(async(req,res)=>{
 const rows=await pool.query(`SELECT r.id,r.rating,r.comment,r.moderation_status AS "moderationStatus",r.moderation_note AS "moderationNote",r.created_at AS "createdAt",b.code,b.service,u.full_name AS "customerName" FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN users u ON u.id=r.customer_id ORDER BY CASE WHEN r.moderation_status='pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 100`);
 res.json(rows.rows);
}));
app.patch('/api/admin/reviews/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({status:z.enum(['approved','rejected']),note:z.string().trim().max(400).default('')}).parse(req.body);
 if(d.status==='rejected'&&d.note.length<5)return fail(res,400,'Cần ghi rõ lý do ẩn đánh giá (ít nhất 5 ký tự).');
 const r=await pool.query(`UPDATE reviews SET moderation_status=$1,moderation_note=$2,moderated_by=$3,moderated_at=now() WHERE id=$4 RETURNING id,moderation_status AS "moderationStatus"`,[d.status,d.note,req.user.id,req.params.id]);
 if(!r.rowCount)return fail(res,404,'Không tìm thấy đánh giá.');res.json(r.rows[0]);
}));

// V6.76: Archive pets with history instead of deleting bookings or foreign keys.
app.patch('/api/pets/:id/archive',auth,handler(async(req,res)=>{
 const owned=await pool.query('SELECT id,name,archived_at FROM pets WHERE id=$1 AND owner_id=$2',[req.params.id,req.user.id]);
 if(!owned.rowCount)return fail(res,404,'Không tìm thấy thú cưng.');
 if(owned.rows[0].archived_at)return fail(res,409,'Hồ sơ đã được lưu trữ.');
 const active=await pool.query("SELECT 1 FROM bookings WHERE pet_id=$1 AND status NOT IN ('Đã hủy','Hoàn tất') LIMIT 1",[req.params.id]);
 if(active.rowCount)return fail(res,409,'Thú cưng còn lịch chưa kết thúc. Vui lòng xử lý lịch trước khi lưu trữ hồ sơ.');
 const updated=await pool.query('UPDATE pets SET archived_at=NOW() WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL RETURNING id',[req.params.id,req.user.id]);
 if(!updated.rowCount)return fail(res,409,'Hồ sơ đã thay đổi; vui lòng tải lại.');
 res.json({ok:true,archived:true});
}));

// V6 safe pet deletion: history must remain consistent.
app.delete('/api/pets/:id',auth,handler(async(req,res)=>{
 const owned=await pool.query('SELECT id FROM pets WHERE id=$1 AND owner_id=$2',[req.params.id,req.user.id]);
 if(!owned.rowCount)return fail(res,404,'Không tìm thấy thú cưng thuộc tài khoản.');
 const hasHistory=await pool.query('SELECT 1 FROM bookings WHERE pet_id=$1 LIMIT 1',[req.params.id]);
 if(hasHistory.rowCount)return fail(res,409,'Thú cưng đã có lịch sử đặt lịch; không thể xóa vĩnh viễn. Hãy chọn Lưu trữ hồ sơ để giữ lại lịch sử.');
 await pool.query('DELETE FROM pets WHERE id=$1 AND owner_id=$2',[req.params.id,req.user.id]);res.json({ok:true});
}));

// V6.41: Retail products are genuine booking line items, not placeholder recommendations.
// All stock decisions and prices are made by PostgreSQL within booking transaction.
app.get('/api/retail/products',auth,handler(async(req,res)=>{
 const r=await pool.query('SELECT id,name,category,description,price,stock,active FROM retail_products WHERE active=true ORDER BY category,name,id');
 res.json(r.rows);
}));
app.get('/api/admin/retail/products',auth,admin,handler(async(req,res)=>{
 const r=await pool.query('SELECT id,name,category,description,price,stock,active,created_at FROM retail_products ORDER BY id DESC');res.json(r.rows);
}));
const retailAdminSchema=z.object({name:z.string().trim().min(3).max(100),category:z.enum(['Thức ăn & Dinh dưỡng','Tắm & Chăm sóc lông','Vệ sinh & Răng miệng','Đồ chơi & Vận động','Đi dạo & Di chuyển','Dụng cụ ăn uống & Nghỉ ngơi']),description:z.string().trim().max(300).default(''),price:z.coerce.number().int().min(1000).max(10000000),stock:z.coerce.number().int().min(0).max(100000),active:z.boolean().default(true)});
app.post('/api/admin/retail/products',auth,admin,handler(async(req,res)=>{
 const d=retailAdminSchema.parse(req.body);const r=await pool.query('INSERT INTO retail_products(name,category,description,price,stock,active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[d.name,d.category,d.description,d.price,d.stock,d.active]);res.status(201).json(r.rows[0]);
}));
app.patch('/api/admin/retail/products/:id',auth,admin,handler(async(req,res)=>{
 const d=retailAdminSchema.parse(req.body);const r=await pool.query('UPDATE retail_products SET name=$1,category=$2,description=$3,price=$4,stock=$5,active=$6,updated_at=now() WHERE id=$7 RETURNING *',[d.name,d.category,d.description,d.price,d.stock,d.active,req.params.id]);if(!r.rowCount)return fail(res,404,'Không tìm thấy sản phẩm');res.json(r.rows[0]);
}));
// Product deletion is allowed only when no booking or shop order has referenced it.
// Otherwise the administrator must archive it, preserving historical receipts and FK integrity.
app.delete('/api/admin/retail/products/:id',auth,admin,handler(async(req,res)=>{
 const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)return fail(res,400,'Mã sản phẩm không hợp lệ.');
 const c=await pool.connect();try{await c.query('BEGIN');
  const found=await c.query('SELECT id,name FROM retail_products WHERE id=$1 FOR UPDATE',[id]);
  if(!found.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy sản phẩm.');}
  const uses=await c.query(`SELECT (SELECT count(*) FROM booking_retail_items WHERE product_id=$1)::int AS bookings,(SELECT count(*) FROM retail_order_items WHERE product_id=$1)::int AS orders`,[id]);
  if(uses.rows[0].bookings||uses.rows[0].orders){await c.query('ROLLBACK');return fail(res,409,'Sản phẩm có lịch sử giao dịch. Hãy dùng Ngừng bán để giữ chứng từ và dữ liệu đối soát.');}
  await c.query('DELETE FROM retail_products WHERE id=$1',[id]);await c.query('COMMIT');res.json({ok:true,id});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23503')return fail(res,409,'Sản phẩm đang được tham chiếu; hãy ngừng bán thay vì xóa.');throw e;}finally{c.release();}
}));
const retailItemsArraySchema=z.array(z.object({id:z.coerce.number().int().positive(),quantity:z.coerce.number().int().min(1).max(3)})).max(3);
const standaloneRetailItemsSchema=z.array(z.object({id:z.coerce.number().int().positive(),quantity:z.coerce.number().int().min(1).max(99)})).min(1).max(100);
const retailSelectionSchema=retailItemsArraySchema.default([]);
const retailDeliveryZoneSchema=z.enum(['inner_hcm','outer_hcm']);
function retailDeliveryQuote(fulfillmentMethod='pickup',zone='inner_hcm'){
 if(fulfillmentMethod!=='delivery')return {fee:0,label:'Nhận tại cửa hàng'};
 const meta={inner_hcm:{fee:25000,label:'TP.HCM nội thành'},outer_hcm:{fee:40000,label:'Ngoại thành / khu xa'}}[zone]||{fee:25000,label:'TP.HCM nội thành'};
 return meta;
}
async function quoteRetail(db,items,lock=false){
 if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('Sản phẩm mua kèm bị trùng.');
 if(!items.length)return {total:0,lines:[],items:[]};
 const ids=items.map(i=>i.id);
 const r=await db.query('SELECT id,name,price,stock,active FROM retail_products WHERE id=ANY($1::bigint[]) ORDER BY id '+(lock?'FOR UPDATE':''),[ids]);
 if(r.rows.length!==ids.length)throw new Error('Sản phẩm mua kèm không tồn tại.');
 let total=0;const lines=[];const result=[];
 for(const x of items){const p=r.rows.find(row=>Number(row.id)===x.id);if(!p?.active)throw new Error('Sản phẩm mua kèm đã ngừng bán.');if(Number(p.stock)<x.quantity)throw new Error('Sản phẩm '+p.name+' không đủ tồn kho.');const amount=Number(p.price)*x.quantity;total+=amount;lines.push({type:'retail',label:'Mua kèm · '+p.name+' × '+x.quantity,amount});result.push({id:x.id,quantity:x.quantity,unitPrice:Number(p.price)});}
 return {total,lines,items:result};
}

app.get('/api/catalog',auth,(req,res)=>res.json({services:Object.fromEntries(Object.entries(services).filter(([,v])=>v.active!==false)),slots,addOns,branches:['PetDay Thảo Điền','PetDay Phú Mỹ Hưng']}));
// Branch capacity closures. They block NEW bookings but never modify existing reservations.
const branchEnum=z.enum(['PetDay Thảo Điền','PetDay Phú Mỹ Hưng']);
const closureSchema=z.object({branch:branchEnum,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),slot:z.enum(['08:30','10:00','13:30','15:00','17:30']),reason:z.string().trim().min(5).max(300)});
app.get('/api/admin/blocked-slots',auth,admin,handler(async(req,res)=>{
 const q=await pool.query("SELECT id,branch,to_char(booking_date,'YYYY-MM-DD') AS date,slot,reason,created_at AS \"createdAt\" FROM blocked_slots WHERE booking_date >= CURRENT_DATE - INTERVAL '7 days' ORDER BY booking_date,slot LIMIT 150");res.json(q.rows);
}));
app.post('/api/admin/blocked-slots',auth,admin,handler(async(req,res)=>{
 const d=closureSchema.parse(req.body);if(!validFutureDate(d.date))return fail(res,422,'Chỉ được đóng lịch cho ngày tương lai.');
 const c=await pool.connect();try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[d.branch,d.date+' '+d.slot]);
 const active=await c.query("SELECT count(*)::int n FROM bookings WHERE branch=$1 AND booking_date=$2 AND slot=$3 AND status <> 'Đã hủy'",[d.branch,d.date,d.slot]);
 if(active.rows[0].n>0){await c.query('ROLLBACK');return fail(res,409,'Khung giờ đã có lịch hẹn. Không được đóng giờ đang có khách; hãy xử lý các lịch hiện tại trước.');}
 const q=await c.query('INSERT INTO blocked_slots(branch,booking_date,slot,reason,created_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(branch,booking_date,slot) DO NOTHING RETURNING id',[d.branch,d.date,d.slot,d.reason,req.user.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,409,'Khung giờ đã được khóa.');}await c.query('COMMIT');res.status(201).json({id:q.rows[0].id});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.delete('/api/admin/blocked-slots/:id',auth,admin,handler(async(req,res)=>{const q=await pool.query('DELETE FROM blocked_slots WHERE id=$1 RETURNING id',[req.params.id]);if(!q.rowCount)return fail(res,404,'Không tìm thấy khung giờ khóa.');res.json({ok:true});}));
// V6.24: daily slot availability for a single date. This is a preview, not a reservation.
// The booking transaction below always rechecks capacity under a PostgreSQL advisory lock.
app.get('/api/availability/day',auth,handler(async(req,res)=>{
 const {branch,date,service}=req.query;
 if(!['PetDay Thảo Điền','PetDay Phú Mỹ Hưng'].includes(branch)||!services[service]||services[service].active===false||!validFutureDate(date))
  return fail(res,400,'Ngày, chi nhánh hoặc dịch vụ không hợp lệ.');
 const [reserved,closures]=await Promise.all([
  pool.query("SELECT slot,COALESCE(SUM(CASE WHEN service IN ('Grooming tạo kiểu','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông','Daycare cả ngày') THEN 2 ELSE 1 END),0)::int AS used FROM bookings WHERE branch=$1 AND booking_date=$2 AND status <> 'Đã hủy' GROUP BY slot",[branch,date]),
  pool.query('SELECT slot,reason FROM blocked_slots WHERE branch=$1 AND booking_date=$2',[branch,date])
 ]);
 const used=Object.fromEntries(reserved.rows.map(row=>[row.slot,Number(row.used)]));
 const blocked=Object.fromEntries(closures.rows.map(row=>[row.slot,row.reason]));
 const result=buildDailySlotPreview({service,branch,used,blocked});
 res.json({branch,date,service,slots:result,checkedAt:new Date().toISOString()});
}));
app.get('/api/availability',auth,handler(async(req,res)=>{const {branch,date,slot,service}=req.query;if(!['PetDay Thảo Điền','PetDay Phú Mỹ Hưng'].includes(branch)||!services[service]||services[service].active===false||!validFutureDate(date)||!validSlot(service,slot))return fail(res,400,'Thời gian hoặc dịch vụ không hợp lệ.');const blocked=await pool.query('SELECT reason FROM blocked_slots WHERE branch=$1 AND booking_date=$2 AND slot=$3',[branch,date,slot]);if(blocked.rowCount)return res.json({remaining:0,available:false,reason:'Khung giờ tạm ngừng nhận lịch: '+blocked.rows[0].reason});const capacity=branch==='PetDay Phú Mỹ Hưng'?Math.max(2,slots[slot]-1):slots[slot];const r=await pool.query("SELECT COALESCE(SUM(CASE WHEN service IN ('Grooming tạo kiểu','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông','Daycare cả ngày') THEN 2 ELSE 1 END),0)::int used FROM bookings WHERE branch=$1 AND booking_date=$2 AND slot=$3 AND status <> 'Đã hủy'",[branch,date,slot]);res.json({remaining:Math.max(0,capacity-r.rows[0].used),available:r.rows[0].used+services[service].units<=capacity});}));
// V6.49: retail-only checkout; independent of care bookings. Supports pickup and home delivery.
const standaloneOrderSchema=z.object({branch:z.enum(['PetDay Thảo Điền','PetDay Phú Mỹ Hưng']),paymentMethod:z.enum(['cash','bank_transfer']),fulfillmentMethod:z.enum(['pickup','delivery']).default('pickup'),deliveryZone:retailDeliveryZoneSchema.optional(),receiverName:z.string().trim().min(2).max(120).optional(),receiverPhone:z.string().trim().min(8).max(20).optional(),deliveryAddress:z.string().trim().min(12).max(250).optional(),deliveryNote:z.string().trim().max(300).optional().default(''),items:standaloneRetailItemsSchema,idempotencyKey:z.string().min(8).max(100)}).strict();
app.get('/api/my/retail-orders',auth,handler(async(req,res)=>{
 const r=await pool.query(`SELECT o.id,o.code,o.branch,o.status,o.payment_method AS "paymentMethod",o.payment_status AS "paymentStatus",o.total,o.fulfillment_method AS "fulfillmentMethod",o.delivery_zone AS "deliveryZone",o.receiver_name AS "receiverName",o.receiver_phone AS "receiverPhone",o.delivery_address AS "deliveryAddress",o.delivery_note AS "deliveryNote",o.delivery_fee AS "deliveryFee",o.created_at AS "createdAt",COALESCE(json_agg(json_build_object('name',p.name,'quantity',i.quantity,'unitPrice',i.unit_price) ORDER BY i.id) FILTER(WHERE i.id IS NOT NULL),'[]') AS items
 FROM retail_orders o LEFT JOIN retail_order_items i ON i.order_id=o.id LEFT JOIN retail_products p ON p.id=i.product_id WHERE o.customer_id=$1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT 80`,[req.user.id]);res.json(r.rows);
}));
app.post('/api/retail/orders',auth,handler(async(req,res)=>{
 if(req.user.role!=='customer')return fail(res,403,'Chỉ tài khoản khách hàng được tạo đơn sản phẩm riêng.');
 const d=standaloneOrderSchema.parse(req.body);
 if(d.paymentMethod==='bank_transfer'&&!await paymentRecipient())return fail(res,422,'Chuyển khoản chưa cấu hình tài khoản nhận tiền.');
 if(d.fulfillmentMethod==='delivery'){
  if(!d.deliveryZone||!d.receiverName||!d.receiverPhone||!d.deliveryAddress)return fail(res,422,'Đơn giao tận nhà cần đủ người nhận, số điện thoại, khu vực và địa chỉ.');
 }
 const shipping=retailDeliveryQuote(d.fulfillmentMethod,d.deliveryZone);
 const c=await pool.connect();try{
  await c.query('BEGIN');
  const old=await c.query('SELECT * FROM retail_orders WHERE customer_id=$1 AND idempotency_key=$2',[req.user.id,d.idempotencyKey]);
  if(old.rowCount){await c.query('COMMIT');return res.json(old.rows[0]);}
  const quote=await quoteRetail(c,d.items,true);
  const code='PS-'+randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  const total=quote.total+shipping.fee;
  const r=await c.query(`INSERT INTO retail_orders(code,customer_id,branch,payment_method,total,idempotency_key,fulfillment_method,delivery_zone,receiver_name,receiver_phone,delivery_address,delivery_note,delivery_fee) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,[code,req.user.id,d.branch,d.paymentMethod,total,d.idempotencyKey,d.fulfillmentMethod,d.fulfillmentMethod==='delivery'?d.deliveryZone:null,d.fulfillmentMethod==='delivery'?d.receiverName:null,d.fulfillmentMethod==='delivery'?d.receiverPhone:null,d.fulfillmentMethod==='delivery'?d.deliveryAddress:null,d.fulfillmentMethod==='delivery'?(d.deliveryNote||''):null,shipping.fee]);
  for(const i of quote.items){await c.query('UPDATE retail_products SET stock=stock-$1,updated_at=now() WHERE id=$2',[i.quantity,i.id]);await c.query('INSERT INTO retail_order_items(order_id,product_id,quantity,unit_price) VALUES($1,$2,$3,$4)',[r.rows[0].id,i.id,i.quantity,i.unitPrice]);}
  await notify(c,req.user.id,'Đơn sản phẩm '+code+' đã được tiếp nhận',d.fulfillmentMethod==='delivery'?'Đơn hàng giao tận nhà đang chờ nhân viên xác nhận tồn kho, phí giao hàng và thanh toán.':'Đơn hàng nhận tại cửa hàng đang chờ nhân viên xác nhận; thanh toán được đối soát riêng.',code);
  await c.query('COMMIT');res.status(201).json(r.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// V6.81: Customers can report a transfer for a standalone shop order.
// A report never marks an order paid; only an authorized admin can do that.
app.post('/api/my/retail-orders/:code/transfer-notice',auth,handler(async(req,res)=>{
 const d=z.object({customerReference:z.string().trim().max(100).default(''),customerNote:z.string().trim().max(300).default(''),senderBank:z.string().trim().min(2).max(100),senderName:z.string().trim().min(2).max(120)}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const q=await c.query('SELECT id,payment_method,payment_status,status FROM retail_orders WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
  if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy đơn hàng.');}
  const o=q.rows[0];
  const issue=retailTransferNoticeIssue({paymentMethod:o.payment_method,paymentStatus:o.payment_status,status:o.status});
  if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
  await c.query(`INSERT INTO retail_transfer_notices(order_id,customer_reference,customer_note,sender_bank,sender_name)
   VALUES($1,$2,$3,$4,$5) ON CONFLICT(order_id) DO UPDATE SET customer_reference=EXCLUDED.customer_reference,customer_note=EXCLUDED.customer_note,sender_bank=EXCLUDED.sender_bank,sender_name=EXCLUDED.sender_name,updated_at=now()`,[o.id,d.customerReference||null,d.customerNote||null,d.senderBank,d.senderName]);
  await c.query('COMMIT');res.json({ok:true,message:'PetDay đã nhận thông báo. Thanh toán đang chờ quản trị xác nhận.'});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.get('/api/my/retail-transfer-notices',auth,handler(async(req,res)=>{
 const q=await pool.query(`SELECT o.code,n.customer_reference AS "customerReference",n.customer_note AS "customerNote",n.sender_bank AS "senderBank",n.sender_name AS "senderName",n.updated_at AS "updatedAt"
 FROM retail_transfer_notices n JOIN retail_orders o ON o.id=n.order_id WHERE o.customer_id=$1 ORDER BY n.updated_at DESC LIMIT 100`,[req.user.id]);res.json(q.rows);
}));
app.get('/api/admin/retail-transfer-notices',auth,admin,handler(async(req,res)=>{
 const q=await pool.query(`SELECT o.code,o.total,o.payment_status AS "paymentStatus",u.full_name AS "customerName",
 n.customer_reference AS "customerReference",n.customer_note AS "customerNote",n.sender_bank AS "senderBank",n.sender_name AS "senderName",n.updated_at AS "updatedAt"
 FROM retail_transfer_notices n JOIN retail_orders o ON o.id=n.order_id JOIN users u ON u.id=o.customer_id
 WHERE o.payment_status='unpaid' ORDER BY n.updated_at DESC LIMIT 100`);res.json(q.rows);
}));
// V6.87 – retail delivery exceptions and refund reviews are separate from payment capture.
// DB migration 044 is required before these routes are used.
app.get('/api/admin/retail/exceptions',auth,admin,handler(async(req,res)=>{
 const r=await pool.query(`SELECT e.id,e.order_id,o.code,o.total,o.payment_status AS "paymentStatus",o.status AS "orderStatus",u.full_name AS "customerName",e.action,e.reason,e.created_at AS "createdAt"
 FROM retail_delivery_events e JOIN retail_orders o ON o.id=e.order_id JOIN users u ON u.id=o.customer_id ORDER BY e.id DESC LIMIT 150`);res.json(r.rows);
}));
app.get('/api/admin/retail/refunds',auth,admin,handler(async(req,res)=>{
 const r=await pool.query(`SELECT r.id,r.order_id,o.code,o.total,o.payment_status AS "paymentStatus",u.full_name AS "customerName",r.amount,r.status,r.reason,r.admin_note AS "adminNote",r.refund_reference AS "refundReference",r.created_at AS "createdAt",r.updated_at AS "updatedAt",r.completed_at AS "completedAt",o.created_at AS "orderCreatedAt",o.status AS "orderStatus"
 FROM retail_refund_requests r JOIN retail_orders o ON o.id=r.order_id JOIN users u ON u.id=o.customer_id ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,r.id DESC LIMIT 150`);res.json(r.rows);
}));
app.get('/api/my/retail/refunds',auth,handler(async(req,res)=>{
 const r=await pool.query(`SELECT r.id,o.code,r.amount,r.status,r.reason,r.admin_note AS "adminNote",r.refund_reference AS "refundReference",r.created_at AS "createdAt",r.completed_at AS "completedAt",o.created_at AS "orderCreatedAt" FROM retail_refund_requests r JOIN retail_orders o ON o.id=r.order_id WHERE o.customer_id=$1 ORDER BY r.id DESC LIMIT 100`,[req.user.id]);res.json(r.rows);
}));
// V6.90: Customer-initiated shop cancellation with Admin review and existing refund ledger.
// Never treat a transfer notice as evidence of received funds.
app.get('/api/my/retail/cancellation-requests',auth,handler(async(req,res)=>{
 const q=await pool.query(`SELECT r.id,o.code,r.status,r.reason,r.admin_note AS "adminNote",r.created_at AS "createdAt"
 FROM retail_cancellation_requests r JOIN retail_orders o ON o.id=r.order_id
 WHERE o.customer_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[req.user.id]);res.json(q.rows);
}));
app.post('/api/my/retail-orders/:code/cancellation-request',auth,handler(async(req,res)=>{
 const d=z.object({reason:z.string().trim().min(10).max(800)}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const q=await c.query('SELECT * FROM retail_orders WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy đơn hàng của bạn.');}
 const o=q.rows[0];
 const requestIssue=customerRetailCancellationIssue(o.status);if(requestIssue){await c.query('ROLLBACK');return fail(res,409,requestIssue);}
 const existing=await c.query('SELECT status FROM retail_cancellation_requests WHERE order_id=$1',[o.id]);
 if(existing.rowCount){await c.query('ROLLBACK');return fail(res,409,customerRetailCancellationIssue(o.status,true));}
 await c.query('INSERT INTO retail_cancellation_requests(order_id,reason) VALUES($1,$2)',[o.id,d.reason]);
 await c.query('INSERT INTO retail_order_events(order_id,actor_id,event_type,note) VALUES($1,$2,$3,$4)',[o.id,req.user.id,'cancellation_requested',d.reason]);
 await c.query('COMMIT');res.status(201).json({ok:true,status:'pending'});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Yêu cầu hủy đã được gửi trước đó.');throw e;}finally{c.release();}
}));
app.get('/api/admin/retail/cancellation-requests',auth,admin,handler(async(req,res)=>{
 const q=await pool.query(`SELECT r.id,r.status,r.reason,r.admin_note AS "adminNote",r.created_at AS "createdAt",
 o.code,o.total,o.status AS "orderStatus",o.payment_status AS "paymentStatus",o.fulfillment_method AS "fulfillmentMethod",u.full_name AS "customerName"
 FROM retail_cancellation_requests r JOIN retail_orders o ON o.id=r.order_id JOIN users u ON u.id=o.customer_id
 ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 150`);res.json(q.rows);
}));
app.patch('/api/admin/retail/cancellation-requests/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({decision:z.enum(['approved','rejected']),note:z.string().trim().min(8).max(800)}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const q=await c.query(`SELECT r.*,o.code,o.customer_id,o.payment_status,o.payment_method,o.total,o.status AS order_status
 FROM retail_cancellation_requests r JOIN retail_orders o ON o.id=r.order_id WHERE r.id=$1 FOR UPDATE OF r,o`,[req.params.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy yêu cầu hủy đơn.');}
 const r=q.rows[0];
 if(r.status!=='pending'){await c.query('ROLLBACK');return fail(res,409,adminRetailCancellationIssue({requestStatus:r.status,orderStatus:r.order_status}));}
 if(d.decision==='approved'){
  const stateIssue=adminRetailCancellationIssue({requestStatus:r.status,orderStatus:r.order_status});if(stateIssue){await c.query('ROLLBACK');return fail(res,409,stateIssue);}
  if(r.payment_method==='bank_transfer'&&r.payment_status!=='paid'){
   const notice=await c.query('SELECT 1 FROM retail_transfer_notices WHERE order_id=$1',[r.order_id]);
   if(notice.rowCount){await c.query('ROLLBACK');return fail(res,409,'Khách đã báo chuyển khoản; cần đối soát trước khi duyệt hủy để tránh bỏ sót khoản hoàn.');}
  }
  const items=await c.query('SELECT product_id,quantity FROM retail_order_items WHERE order_id=$1',[r.order_id]);
  for(const i of items.rows)await c.query('UPDATE retail_products SET stock=stock+$1,updated_at=now() WHERE id=$2',[i.quantity,i.product_id]);
  await c.query("UPDATE retail_orders SET status='cancelled',updated_at=now() WHERE id=$1",[r.order_id]);
  if(r.payment_status==='paid')await c.query(`INSERT INTO retail_refund_requests(order_id,amount,reason)
   VALUES($1,$2,$3) ON CONFLICT(order_id) DO NOTHING`,[r.order_id,r.total,'Hủy đơn theo yêu cầu khách: '+r.reason]);
 }
 await c.query('UPDATE retail_cancellation_requests SET status=$1,admin_note=$2,decided_by=$3,decided_at=now() WHERE id=$4',[d.decision,d.note,req.user.id,r.id]);
 await c.query('INSERT INTO retail_order_events(order_id,actor_id,event_type,note) VALUES($1,$2,$3,$4)',[r.order_id,req.user.id,d.decision==='approved'?'cancellation_approved':'cancellation_rejected',d.note]);
 await notify(c,r.customer_id,'Yêu cầu hủy đơn '+r.code,d.decision==='approved'?(r.payment_status==='paid'?'Đơn đã hủy; hồ sơ hoàn tiền đang chờ xét duyệt riêng.':'Đơn đã được hủy thành công.'):'Yêu cầu hủy chưa được chấp thuận: '+d.note,r.code);
 await c.query('COMMIT');res.json({ok:true,status:d.decision});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.post('/api/admin/retail/orders/:code/exception',auth,admin,handler(async(req,res)=>{
 const d=z.object({action:z.enum(['failed','retry','return_pending','returned']),reason:z.string().trim().min(8).max(500),deliveryEta:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),restockApproved:z.boolean().optional()}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const qr=await c.query('SELECT * FROM retail_orders WHERE code=$1 FOR UPDATE',[req.params.code]);
 if(!qr.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy đơn.');}
 const o=qr.rows[0];if(o.fulfillment_method!=='delivery'){await c.query('ROLLBACK');return fail(res,409,'Chỉ áp dụng cho đơn giao tận nhà.');}
 const allowed={failed:['shipping'],retry:['delivery_failed'],return_pending:['delivery_failed'],returned:['return_pending']};
 if(!allowed[d.action].includes(o.status)){await c.query('ROLLBACK');return fail(res,409,'Không thể thực hiện bước này từ trạng thái '+o.status+'.');}
 if(d.action==='retry'&&(!d.deliveryEta||d.deliveryEta<new Date().toISOString().slice(0,10))){await c.query('ROLLBACK');return fail(res,422,'Giao lại phải có ngày dự kiến từ hôm nay.');}
 const next={failed:'delivery_failed',retry:'shipping',return_pending:'return_pending',returned:'returned'}[d.action];
 if(d.action==='returned'){
  const items=await c.query('SELECT product_id,quantity FROM retail_order_items WHERE order_id=$1',[o.id]);
  // Restock only after inspected and explicitly approved; damaged/unsealed goods remain out of sellable inventory.
  if(d.restockApproved===true)for(const i of items.rows)await c.query('UPDATE retail_products SET stock=stock+$1,updated_at=now() WHERE id=$2',[i.quantity,i.product_id]);
  if(o.payment_status==='paid')await c.query(`INSERT INTO retail_refund_requests(order_id,amount,reason) VALUES($1,$2,$3) ON CONFLICT(order_id) DO NOTHING`,[o.id,o.total,'Hàng chưa được khách nhận và đã hoàn về; hoàn 100% khoản đã thu. '+d.reason]);
 }
 await c.query('UPDATE retail_orders SET status=$1,delivery_eta=CASE WHEN $2::date IS NULL THEN delivery_eta ELSE $2::date END,updated_at=now() WHERE id=$3',[next,d.action==='retry'?d.deliveryEta:null,o.id]);
 await c.query('INSERT INTO retail_delivery_events(order_id,actor_id,action,reason) VALUES($1,$2,$3,$4)',[o.id,req.user.id,d.action,d.reason]);
 await c.query('INSERT INTO retail_order_events(order_id,actor_id,event_type,note) VALUES($1,$2,$3,$4)',[o.id,req.user.id,d.action,d.reason]);
 await notify(c,o.customer_id,'Cập nhật giao hàng · '+o.code,({failed:'Giao hàng chưa thành công. PetDay sẽ liên hệ hỗ trợ.',retry:'Đơn được lên lịch giao lại.',return_pending:'Đơn đang chờ hàng hoàn về để kiểm tra.',returned:'PetDay đã ghi nhận hàng hoàn. Nếu đã thanh toán, khoản hoàn cần được xét riêng.'})[d.action]+' Lý do: '+d.reason,o.code);
 await c.query('COMMIT');res.json({ok:true,code:o.code,status:next});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.patch('/api/admin/retail/refunds/:id',auth,admin,handler(async(req,res)=>{
 const d=z.discriminatedUnion('decision',[z.object({decision:z.literal('approve'),amount:z.number().int().positive(),note:z.string().trim().max(1000).default('')}),z.object({decision:z.literal('reject'),note:z.string().trim().min(8).max(1000)}),z.object({decision:z.literal('complete'),reference:z.string().trim().min(4).max(120),note:z.string().trim().max(1000).default('')})]).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const q=await c.query('SELECT r.*,o.total,o.status AS order_status,o.payment_status,o.code,o.customer_id FROM retail_refund_requests r JOIN retail_orders o ON o.id=r.order_id WHERE r.id=$1 FOR UPDATE OF r',[req.params.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy hồ sơ hoàn tiền.');}
 const r=q.rows[0];if(r.payment_status!=='paid'){await c.query('ROLLBACK');return fail(res,409,'Chỉ xét hoàn khoản đã ghi nhận thanh toán.');}
 // V6.91: paid order cancelled before handover or returned undelivered -> full refund.
 const undeliveredOrder=retailNotReceived(r.order_status);
 const retailPolicyIssue=fullRefundDecisionIssue({mandatory:undeliveredOrder,decision:d.decision,amount:d.decision==='approve'?d.amount:undefined,total:r.total});
 if(retailPolicyIssue){await c.query('ROLLBACK');return fail(res,409,retailPolicyIssue);}
 const next=d.decision==='approve'?'approved':d.decision==='reject'?'rejected':'completed';
 if((r.status==='pending'&&!['approve','reject'].includes(d.decision))||(r.status==='approved'&&d.decision!=='complete')||!['pending','approved'].includes(r.status)){await c.query('ROLLBACK');return fail(res,409,'Hồ sơ đã xử lý hoặc trạng thái không phù hợp.');}
 const amount=undeliveredOrder?Number(r.total):(d.decision==='approve'?d.amount:Number(r.amount));
 if(!Number.isSafeInteger(amount)||amount<=0||amount>Number(r.total)){await c.query('ROLLBACK');return fail(res,422,'Số tiền hoàn không hợp lệ.');}
 if(d.decision==='approve'&&amount<Number(r.total)&&d.note.length<8){await c.query('ROLLBACK');return fail(res,422,'Hoàn một phần phải ghi lý do ít nhất 8 ký tự.');}
 await c.query(`UPDATE retail_refund_requests SET status=$1,amount=$2,admin_note=$3,refund_reference=CASE WHEN $1='completed' THEN $4 ELSE refund_reference END,processed_by=$5,updated_at=now(),completed_at=CASE WHEN $1='completed' THEN now() ELSE completed_at END WHERE id=$6`,[next,amount,d.note,d.decision==='complete'?d.reference:null,req.user.id,r.id]);
 await notify(c,r.customer_id,'Cập nhật hoàn tiền đơn '+r.code,next==='approved'?'Đã duyệt phương án hoàn '+amount.toLocaleString('vi-VN')+'đ, đang chờ xử lý.':next==='completed'?'PetDay đã ghi nhận hoàn tiền, mã tham chiếu '+d.reference:'Yêu cầu hoàn tiền chưa được chấp thuận: '+d.note,r.code);
 await c.query('COMMIT');res.json({ok:true,status:next,amount});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Mã đối soát hoàn tiền đã được sử dụng.');throw e;}finally{c.release();}
}));
app.get('/api/admin/retail/orders',auth,admin,handler(async(req,res)=>{
 const r=await pool.query(`SELECT o.*,u.full_name AS customer_name,u.email AS customer_email FROM retail_orders o JOIN users u ON u.id=o.customer_id ORDER BY o.created_at DESC LIMIT 100`);res.json(r.rows);
}));
app.patch('/api/admin/retail/orders/:code',auth,admin,handler(async(req,res)=>{
 const d=z.object({status:z.enum(['confirmed','ready','shipping','completed','cancelled']).optional(),deliveryEta:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),paymentReference:z.string().trim().min(4).max(120).optional()}).strict().refine(x=>Boolean(x.status||x.paymentReference||x.deliveryEta),'Không có thay đổi').parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const q=await c.query('SELECT * FROM retail_orders WHERE code=$1 FOR UPDATE',[req.params.code]);
  if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy đơn.');}
  const o=q.rows[0];
  const mode=o.fulfillment_method||'pickup';
  // Shipping / ETA requires migration 039. Fail before mutating payment or order state.
  if((d.status==='shipping'||d.deliveryEta)&&!Object.prototype.hasOwnProperty.call(o,'delivery_eta')){
   await c.query('ROLLBACK');return fail(res,503,'Thiếu cột delivery_eta. Sao lưu PostgreSQL TEST và đối chiếu migration 039_v667_retail_delivery_status.sql trước khi dùng Đang giao.');
  }
  if(d.status){const issue=retailTransitionIssue({status:o.status,nextStatus:d.status,fulfillment:mode,paymentMethod:o.payment_method,paid:o.payment_status==='paid',hasPaymentReference:Boolean(d.paymentReference),hasDeliveryEta:Boolean(d.deliveryEta||o.delivery_eta)});if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}}
  if(d.deliveryEta){
   if(mode!=='delivery'||['completed','cancelled'].includes(o.status)){await c.query('ROLLBACK');return fail(res,409,'Ngày giao dự kiến chỉ áp dụng cho đơn giao tận nhà đang xử lý.');}
   if(d.deliveryEta<new Date().toISOString().slice(0,10)){await c.query('ROLLBACK');return fail(res,422,'Ngày giao dự kiến không thể trong quá khứ.');}
  }

  if(d.paymentReference){
   if(['completed','cancelled'].includes(o.status)){await c.query('ROLLBACK');return fail(res,409,'Không được ghi nhận thanh toán cho đơn đã kết thúc hoặc hủy.');}
   if(o.payment_status==='paid'){await c.query('ROLLBACK');return fail(res,409,'Đơn đã ghi nhận thanh toán, không ghi trùng.');}
   await c.query("UPDATE retail_orders SET payment_status='paid',payment_reference=$1,paid_at=now() WHERE id=$2",[d.paymentReference,o.id]);
  }
  if(d.status==='cancelled'){
   if(o.payment_status==='paid'||d.paymentReference){await c.query('ROLLBACK');return fail(res,409,'Đơn đã thu tiền phải qua quy trình hoàn tiền riêng, không thể hủy trực tiếp.');}
   const items=await c.query('SELECT product_id,quantity FROM retail_order_items WHERE order_id=$1',[o.id]);
   for(const i of items.rows)await c.query('UPDATE retail_products SET stock=stock+$1,updated_at=now() WHERE id=$2',[i.quantity,i.product_id]);
  }
  if(d.deliveryEta)await c.query('UPDATE retail_orders SET delivery_eta=$1 WHERE id=$2',[d.deliveryEta,o.id]);
  if(d.status)await c.query('UPDATE retail_orders SET status=$1,updated_at=now() WHERE id=$2',[d.status,o.id]);
  await c.query('INSERT INTO retail_order_events(order_id,actor_id,event_type,note) VALUES($1,$2,$3,$4)',[o.id,req.user.id,d.status||'payment_verified',d.paymentReference?'Reference recorded':'Status updated']);
  const next=await c.query('SELECT * FROM retail_orders WHERE id=$1',[o.id]);await c.query('COMMIT');res.json(next.rows[0]);
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Mã giao dịch ngân hàng đã được sử dụng ở đơn khác.');throw e;}finally{c.release();}
}));
const bookingSchema=z.object({petId:z.coerce.number().int().positive(),service:z.string().refine(name=>Object.hasOwn(services,name),'Gói dịch vụ không hợp lệ'),branch:z.enum(['PetDay Thảo Điền','PetDay Phú Mỹ Hưng']),date:z.string(),slot:z.string(),idempotencyKey:z.string().min(8).max(100),paymentMethod:z.enum(['cash','bank_transfer']).default('cash'),promoCode:z.string().trim().max(32).optional().default(''),addOns:z.array(z.string()).max(3).default([]),retail:retailSelectionSchema,taxi:z.object({enabled:z.boolean(),zone:z.enum(['nearby','extended']),address:z.string().trim().max(250),phone:z.string().trim().max(20)}).optional()});
app.post('/api/bookings',auth,handler(async(req,res)=>{const b=bookingSchema.parse(req.body);let taxiFare;try{taxiFare=taxiQuote(b.taxi);}catch(e){return fail(res,422,e.message);}if(b.paymentMethod==='bank_transfer'&&!await paymentRecipient())return fail(res,422,'Chuyển khoản chưa được cấu hình. Vui lòng chọn tiền mặt tại cơ sở.');if(!validFutureDate(b.date)||!validSlot(b.service,b.slot))return fail(res,400,'Ngày hoặc giờ không phù hợp.');const c=await pool.connect();try{await c.query('BEGIN');const existing=await c.query('SELECT * FROM bookings WHERE customer_id=$1 AND idempotency_key=$2',[req.user.id,b.idempotencyKey]);if(existing.rows.length){await c.query('COMMIT');return res.json(existing.rows[0]);}const packageState=await c.query('SELECT is_active FROM service_price_settings WHERE name=$1 FOR SHARE',[b.service]);if(!packageState.rowCount||!packageState.rows[0].is_active){await c.query('ROLLBACK');return fail(res,409,'Gói dịch vụ đã tạm ngừng nhận lịch. Vui lòng chọn gói khác.');}const p=await c.query('SELECT * FROM pets WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL',[b.petId,req.user.id]);if(!p.rows.length){await c.query('ROLLBACK');return fail(res,404,'Hồ sơ thú cưng không thuộc tài khoản.');}let quote,extras;try{quote=calculate(b.service,p.rows[0]);extras=calculateExtras(b.service,b.addOns);}catch(err){await c.query('ROLLBACK');return fail(res,422,err.message||'Dịch vụ hoặc chăm sóc cộng thêm không phù hợp với thú cưng.');}quote.lines.push(...extras.lines);quote.total+=extras.total;let retail;try{retail=await quoteRetail(c,b.retail,true);}catch(err){await c.query('ROLLBACK');return fail(res,422,err.message);}quote.lines.push(...retail.lines);quote.total+=retail.total;if(taxiFare.line){quote.lines.push(taxiFare.line);quote.total+=taxiFare.fee;}let discount=0;let verifiedPromo='';if(b.promoCode){const code=b.promoCode.toUpperCase();const offer=await c.query('SELECT * FROM promotions WHERE code=$1 AND active=true AND starts_at<=now() AND ends_at>now() FOR UPDATE',[code]);if(!offer.rowCount){await c.query('ROLLBACK');return fail(res,422,'Mã ưu đãi không tồn tại hoặc đã hết hạn.');}const o=offer.rows[0];if(quote.total<Number(o.min_order)){await c.query('ROLLBACK');return fail(res,422,'Giá trị dịch vụ chưa đạt mức tối thiểu để áp dụng ưu đãi.');}if(o.service_name&&o.service_name!==b.service){await c.query('ROLLBACK');return fail(res,422,'Mã không áp dụng cho dịch vụ này.');}const used=await c.query("SELECT count(*)::int AS n FROM bookings WHERE promo_code=$1 AND status <> 'Đã hủy'",[code]);if(o.max_uses!==null&&used.rows[0].n>=o.max_uses){await c.query('ROLLBACK');return fail(res,422,'Mã đã hết lượt sử dụng.');}const personal=await c.query("SELECT count(*)::int AS n FROM bookings WHERE promo_code=$1 AND customer_id=$2 AND status <> 'Đã hủy'",[code,req.user.id]);if(personal.rows[0].n>=o.max_per_customer){await c.query('ROLLBACK');return fail(res,422,'Bạn đã sử dụng hết số lần áp dụng mã này.');}discount=o.discount_type==='percent'?Math.floor(quote.total*Number(o.discount_value)/100):Number(o.discount_value);if(o.max_discount!==null)discount=Math.min(discount,Number(o.max_discount));discount=Math.min(discount,quote.total);verifiedPromo=code;}await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[b.branch,b.date+' '+b.slot]);const closed=await c.query('SELECT 1 FROM blocked_slots WHERE branch=$1 AND booking_date=$2 AND slot=$3',[b.branch,b.date,b.slot]);if(closed.rowCount){await c.query('ROLLBACK');return fail(res,409,'Khung giờ đã tạm ngừng nhận lịch. Vui lòng chọn giờ khác.');}// V6.45: a pet cannot attend overlapping appointments, even at different branches.
// The per-pet/date advisory lock serializes concurrent submissions for the same pet.
await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))', ['petday-pet-'+b.petId,b.date]);
const petSameDay=await c.query("SELECT service,slot FROM bookings WHERE pet_id=$1 AND booking_date=$2 AND status NOT IN ('Đã hủy','Không đến')",[b.petId,b.date]);
if(petSameDay.rows.some(existing=>servicesOverlap(existing.service,existing.slot,b.service,b.slot))){
 await c.query('ROLLBACK');
 return fail(res,409,'Thú cưng đã có lịch trùng thời gian. Hãy chọn khung giờ khác cho dịch vụ thứ hai.');
}
const limit=b.branch==='PetDay Phú Mỹ Hưng'?Math.max(2,slots[b.slot]-1):slots[b.slot];const used=await c.query("SELECT COALESCE(SUM(CASE WHEN service IN ('Grooming tạo kiểu','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông','Daycare cả ngày') THEN 2 ELSE 1 END),0)::int used FROM bookings WHERE branch=$1 AND booking_date=$2 AND slot=$3 AND status <> 'Đã hủy'",[b.branch,b.date,b.slot]);if(used.rows[0].used+services[b.service].units>limit){await c.query('ROLLBACK');return fail(res,409,'Khung giờ vừa hết chỗ. Vui lòng chọn lại.');}if(discount>0){quote.lines.push({label:'Ưu đãi '+verifiedPromo,amount:-discount});quote.total-=discount;}const code='PD-'+randomUUID().replaceAll('-','').slice(0,10).toUpperCase();const r=await c.query('INSERT INTO bookings(code,customer_id,pet_id,service,branch,booking_date,slot,line_items,total,idempotency_key,payment_method,promo_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',[code,req.user.id,b.petId,b.service,b.branch,b.date,b.slot,JSON.stringify(quote.lines),quote.total,b.idempotencyKey,b.paymentMethod,verifiedPromo||null]);for(const item of retail.items){await c.query('UPDATE retail_products SET stock=stock-$1,updated_at=now() WHERE id=$2',[item.quantity,item.id]);await c.query('INSERT INTO booking_retail_items(booking_id,product_id,quantity,unit_price) VALUES($1,$2,$3,$4)',[r.rows[0].id,item.id,item.quantity,item.unitPrice]);}if(taxiFare.line){await c.query('INSERT INTO pet_taxi_requests(booking_id,zone,pickup_address,contact_phone,fee,status) VALUES($1,$2,$3,$4,$5,$6)',[r.rows[0].id,b.taxi.zone,b.taxi.address.trim(),b.taxi.phone.trim(),taxiFare.fee,'requested']);}await notify(c,req.user.id,'Đã tiếp nhận lịch '+code,'Lịch đang chờ nhân viên xác nhận. Thanh toán sẽ được đối soát riêng.',code);await c.query('COMMIT');res.status(201).json(r.rows[0]);}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}));

// Release the exclusive staff slot while retaining an audit trail when an appointment moves or is cancelled.
async function releaseStaff(client, bookingId, actorId, reason){
 const found=await client.query('DELETE FROM booking_assignments WHERE booking_id=$1 RETURNING staff_id',[bookingId]);
 if(found.rowCount)await client.query('INSERT INTO staff_assignment_events(booking_id,staff_id,action,changed_by,note) VALUES($1,$2,$3,$4,$5)',[bookingId,found.rows[0].staff_id,'released',actorId,reason]);
}

const detailSQL=`SELECT i.emergency_phone AS "intakeEmergencyPhone",i.health_alerts AS "intakeHealthAlerts",i.care_instructions AS "intakeCareInstructions",i.updated_at AS "intakeUpdatedAt",am.full_name AS "assignedStaff",a.staff_id AS "assignedStaffId",b.id,b.code,b.customer_id,b.pet_id AS "petId",b.service,b.branch,to_char(b.booking_date,'YYYY-MM-DD') AS date,b.slot,b.status,b.payment_status AS "paymentStatus",b.payment_method AS "paymentMethod",b.line_items AS "lineItems",b.total,b.promo_code AS "promoCode",b.created_at AS "createdAt",p.name AS "petName",u.full_name AS "ownerName",cr.notes AS "careNotes",to_char(cr.care_date,'YYYY-MM-DD') AS "careDate",r.rating,r.comment,ns.reason AS "noShowReason",ns.recorded_at AS "noShowAt",tx.status AS "taxiStatus",tx.zone AS "taxiZone",tx.pickup_address AS "taxiAddress",tx.contact_phone AS "taxiPhone",tx.fee AS "taxiFee" FROM bookings b JOIN pets p ON p.id=b.pet_id JOIN users u ON u.id=b.customer_id LEFT JOIN care_records cr ON cr.booking_id=b.id LEFT JOIN reviews r ON r.booking_id=b.id LEFT JOIN booking_assignments a ON a.booking_id=b.id LEFT JOIN staff_members am ON am.id=a.staff_id LEFT JOIN booking_no_shows ns ON ns.booking_id=b.id LEFT JOIN pet_taxi_requests tx ON tx.booking_id=b.id LEFT JOIN booking_intake_forms i ON i.booking_id=b.id`;
app.get('/api/bookings',auth,handler(async(req,res)=>{
 let where='',params=[];
 if(req.user.role==='customer'){where=' WHERE b.customer_id=$1';params=[req.user.id];}
 if(req.user.role==='staff'){where=" WHERE a.staff_id IS NOT NULL AND am.active=true AND am.user_id=$1 AND b.status IN ('Đã xác nhận','Đang thực hiện','Hoàn tất')";params=[req.user.id];}
 const r=await pool.query(detailSQL+where+' ORDER BY b.booking_date DESC,b.slot DESC',params);
 if(req.user.role==='staff')return res.json(r.rows.map(({code,date,slot,status,service,branch,petName,assignedStaff,intakeEmergencyPhone,intakeHealthAlerts,intakeCareInstructions,intakeUpdatedAt})=>({code,date,slot,status,service,branch,petName,assignedStaff,intakeEmergencyPhone,intakeHealthAlerts,intakeCareInstructions,intakeUpdatedAt})));
 res.json(r.rows);
}));

// Customer pre-arrival notes: authenticated owner only, never usable to change price or payment.
const intakeSchema=z.object({
 emergencyPhone:z.string().trim().refine(validEmergencyPhone,'Số điện thoại liên hệ chưa hợp lệ.'),
 healthAlerts:z.string().trim().max(600).default(''),
 careInstructions:z.string().trim().max(600).default(''),
 ownerConfirmed:z.literal(true)
});
app.put('/api/bookings/:code/intake',auth,handler(async(req,res)=>{
 if(req.user.role!=='customer')return fail(res,403,'Chỉ chủ thú cưng được gửi thông tin trước khi đến.');
 const d=intakeSchema.parse(req.body);
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const result=await c.query(`SELECT b.id,b.status FROM bookings b WHERE b.code=$1 AND b.customer_id=$2 FOR UPDATE`,[req.params.code,req.user.id]);
  if(!result.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch thuộc tài khoản của bạn.');}
  const booking=result.rows[0];
  const checkedIn=await c.query("SELECT 1 FROM service_events WHERE booking_id=$1 AND event_type='check_in'",[booking.id]);
  const issue=intakeEditIssue(booking.status,checkedIn.rowCount>0);
  if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
  const saved=await c.query(`INSERT INTO booking_intake_forms(booking_id,emergency_phone,health_alerts,care_instructions,owner_confirmed)
   VALUES($1,$2,$3,$4,true)
   ON CONFLICT(booking_id) DO UPDATE SET emergency_phone=excluded.emergency_phone,health_alerts=excluded.health_alerts,care_instructions=excluded.care_instructions,owner_confirmed=true,updated_at=now()
   RETURNING updated_at`,[booking.id,d.emergencyPhone,d.healthAlerts,d.careInstructions]);
  await c.query('COMMIT');
  res.json({ok:true,updatedAt:saved.rows[0].updated_at});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));

// Operational exception: confirmed customer did not arrive. Never charge automatically.
// Admin-controlled operational closeout after confirmation; keep auditable reason and arrival safeguards.
app.post('/api/admin/bookings/:code/no-show',auth,admin,handler(async(req,res)=>{
 const d=z.object({reason:z.string().trim().min(8).max(500)}).parse(req.body);
 const c=await pool.connect();try{
  await c.query('BEGIN');
  const row=await c.query('SELECT * FROM bookings WHERE code=$1 FOR UPDATE',[req.params.code]);
  if(!row.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch hẹn.');}
  const b=row.rows[0];
  const preflight=noShowIssue({status:b.status,paymentStatus:b.payment_status,hasServiceEvent:false});
  if(preflight){await c.query('ROLLBACK');return fail(res,409,preflight);}
  // A completed Pet Taxi handover is evidence of arrival; no-show must be forbidden on the server as well.
  const taxiDelivered=await c.query("SELECT 1 FROM pet_taxi_requests WHERE booking_id=$1 AND status='completed' LIMIT 1",[b.id]);
  if(taxiDelivered.rowCount){await c.query('ROLLBACK');return fail(res,409,'Pet Taxi đã bàn giao thú cưng tại cơ sở. Không thể ghi nhận khách không đến.');}
  const arrived=await c.query('SELECT 1 FROM service_events WHERE booking_id=$1 LIMIT 1',[b.id]);
  if(arrived.rowCount){await c.query('ROLLBACK');return fail(res,409,noShowIssue({status:b.status,paymentStatus:b.payment_status,hasServiceEvent:true}));}
  // An early no-show is an explicit administrative declaration, not inferred attendance.
  // An existing pending cancellation decision must not survive a closed booking.
  await c.query('INSERT INTO booking_no_shows(booking_id,recorded_by,reason) VALUES($1,$2,$3)',[b.id,req.user.id,d.reason]);
  // Paid no-show: preserve the receipt and open a separate, auditable refund review.
  // No automatic approval, fee deduction, or claim of a bank refund.
  if(b.payment_status==='Đã thanh toán'){
   await c.query(`INSERT INTO refund_requests(booking_id,customer_id,amount,reason)
      VALUES($1,$2,$3,$4) ON CONFLICT (booking_id) DO NOTHING`,
     [b.id,b.customer_id,b.total,'Khách chưa sử dụng dịch vụ; theo chính sách PetDay hoàn 100% khoản đã thu. Ghi nhận: '+d.reason]);
  }
  await releaseStaff(c,b.id,req.user.id,'Khách không đến lịch hẹn');
  await c.query("UPDATE bookings SET status='Đã hủy' WHERE id=$1",[b.id]);
  await c.query("UPDATE booking_cancellation_requests SET status='rejected',admin_note=$2,resolved_at=now(),resolved_by=$3 WHERE booking_id=$1 AND status='pending'",[b.id,'Lịch đã đóng do Admin ghi nhận khách không đến: '+d.reason,req.user.id]);
  await notify(c,b.customer_id,'Lịch '+b.code+' được ghi nhận không đến','Lịch đã đóng vì khách không đến. Nếu đã thanh toán, PetDay sẽ xử lý hoàn 100% qua hồ sơ hoàn tiền; chỉ ghi đã hoàn sau khi Admin xác nhận hoàn tất. Lý do: '+d.reason,b.code);
  await c.query('COMMIT');res.json({ok:true,code:b.code,status:'Đã hủy',noShowReason:d.reason});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Taxi is a request, not an automatically confirmed vehicle booking.
app.patch('/api/admin/bookings/:code/taxi',auth,admin,handler(async(req,res)=>{
 const {status}=z.object({status:z.enum(['confirmed','completed'])}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const q=await c.query('SELECT tx.id,tx.status,b.customer_id,b.status AS booking_status,b.booking_date,b.slot FROM pet_taxi_requests tx JOIN bookings b ON b.id=tx.booking_id WHERE b.code=$1 FOR UPDATE OF tx',[req.params.code]);
  if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Lịch không có đăng ký Pet Taxi.');}
  const row=q.rows[0];
  if(row.booking_status==='Đã hủy'){await c.query('ROLLBACK');return fail(res,409,'Lịch đã hủy.');}
  if(!['Đã xác nhận','Đang thực hiện'].includes(row.booking_status)){await c.query('ROLLBACK');return fail(res,409,'Phải duyệt lịch dịch vụ trước khi điều phối Pet Taxi.');}
  // V6.71: Admin may confirm completed handoff after booking approval.
  // No automatic clock-based status transitions; the admin records an actual event.
  if(status==='confirmed'&&row.status!=='requested'){await c.query('ROLLBACK');return fail(res,409,'Chuyến Taxi đã được điều phối trước đó.');}
  if(status==='completed'&&!['requested','confirmed'].includes(row.status)){await c.query('ROLLBACK');return fail(res,409,'Taxi đã hoàn tất hoặc không thể cập nhật chuyến này.');}
  await c.query('UPDATE pet_taxi_requests SET status=$1,updated_by=$2,updated_at=now() WHERE id=$3',[status,req.user.id,row.id]);
  await notify(c,row.customer_id,'Cập nhật Pet Taxi '+req.params.code,status==='confirmed'?'PetDay đã nhận điều phối chuyến đón. Nhân viên sẽ liên hệ xác nhận thời gian.':'Pet Taxi đã đón và bàn giao thú cưng tại cơ sở; nhân viên có thể tiếp nhận và bắt đầu dịch vụ.',req.params.code);
  await c.query('COMMIT');res.json({status});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Assign confirmed bookings to available active staff profiles; no shift creation needed.
// Staff duration overlaps are checked across the entire day and branch.
async function autoAssignConfirmed(c, booking, adminId){
 const lockKey=['petday-auto-dispatch',booking.branch,booking.booking_date instanceof Date?booking.booking_date.toISOString().slice(0,10):String(booking.booking_date),'full-day'].join(':');
 await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[lockKey]);
 const existing=await c.query('SELECT 1 FROM booking_assignments WHERE booking_id=$1',[booking.id]);
 if(existing.rowCount)return null;
 const available=await c.query('SELECT id,full_name FROM staff_members WHERE active=true AND branch=$1 ORDER BY id',[booking.branch]);
 let staff=null;
 for(const candidate of available.rows){
  const occupied=await c.query(`SELECT b.service,b.slot FROM booking_assignments a JOIN bookings b ON b.id=a.booking_id
  WHERE a.staff_id=$1 AND a.booking_date=$2 AND b.status IN ('Đã xác nhận','Đang thực hiện')`,[candidate.id,booking.booking_date]);
  if(occupied.rows.every(other=>!servicesOverlap(booking.service,booking.slot,other.service,other.slot))){staff=candidate;break;}
 }
 if(!staff)return null;
 await c.query('INSERT INTO booking_assignments(booking_id,staff_id,booking_date,slot,assigned_by) VALUES($1,$2,$3,$4,$5)',[booking.id,staff.id,booking.booking_date,booking.slot,adminId]);
 await c.query('INSERT INTO staff_assignment_events(booking_id,staff_id,action,changed_by,note) VALUES($1,$2,$3,$4,$5)',[booking.id,staff.id,'assigned',adminId,'Tự phân công từ danh sách nhân viên hoạt động khi duyệt lịch']);
 await notify(c,booking.customer_id,'Nhân viên phụ trách lịch '+booking.code,'PetDay đã phân công '+staff.full_name+' phụ trách lịch chăm sóc.',booking.code);
 return staff.full_name;
}
app.patch('/api/bookings/:code/status',auth,admin,handler(async(req,res)=>{const {status}=z.object({status:z.enum(['Đã xác nhận','Đang thực hiện','Hoàn tất','Đã hủy'])}).parse(req.body);const c=await pool.connect();try{await c.query('BEGIN');const r=await c.query('SELECT * FROM bookings WHERE code=$1 FOR UPDATE',[req.params.code]);if(!r.rows.length){await c.query('ROLLBACK');return fail(res,404,'Không thấy lịch.');}if(!transitions[r.rows[0].status]?.includes(status)){await c.query('ROLLBACK');return fail(res,409,'Chuyển trạng thái không hợp lệ.');}
if(status==='Đã xác nhận'&&r.rows[0].payment_method==='bank_transfer'&&r.rows[0].payment_status!=='Đã thanh toán'){await c.query('ROLLBACK');return fail(res,409,'Lịch chuyển khoản phải được Admin xác nhận thanh toán trước khi duyệt lịch.');}
if(status==='Đã xác nhận'){const cr=await c.query("SELECT 1 FROM booking_cancellation_requests WHERE booking_id=$1 AND status='pending'",[r.rows[0].id]);if(cr.rowCount){await c.query('ROLLBACK');return fail(res,409,'Lịch đang có yêu cầu hủy chờ xử lý.');}// Pet Taxi is an independent workflow: pending dispatch does not block booking approval.
}
if(status==='Đang thực hiện'||status==='Hoàn tất'){await c.query('ROLLBACK');return fail(res,409,'Hãy sử dụng nhật ký tiến trình (check-in, chăm sóc, bàn giao) để cập nhật trạng thái.');}
if(status==='Đã hủy'){
 await releaseStaff(c,r.rows[0].id,req.user.id,'Quản trị hủy lịch');
 if(r.rows[0].payment_status==='Đã thanh toán'){
  await c.query('INSERT INTO refund_requests(booking_id,customer_id,amount,reason) VALUES($1,$2,$3,$4) ON CONFLICT (booking_id) DO NOTHING',[r.rows[0].id,r.rows[0].customer_id,r.rows[0].total,'Admin đã hủy lịch chưa bắt đầu; hoàn 100% khoản đã thu.']);
  await notify(c,r.rows[0].customer_id,'Hoàn tiền lịch '+req.params.code,'Lịch đã hủy. Hồ sơ hoàn 100% đang chờ Admin xử lý, chưa phải tiền đã chuyển về.',req.params.code);
 }
}
const done=await c.query('UPDATE bookings SET status=$1 WHERE code=$2 RETURNING *',[status,req.params.code]);const assignedStaff=status==='Đã xác nhận'?await autoAssignConfirmed(c,done.rows[0],req.user.id):null;await notify(c,r.rows[0].customer_id,'Cập nhật lịch '+req.params.code,'Trạng thái dịch vụ: '+status,req.params.code);await c.query('COMMIT');res.json({...done.rows[0],assignedStaff:assignedStaff||null,assignmentPending:status==='Đã xác nhận'&&!assignedStaff});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}));
app.patch('/api/admin/bookings/:code/payment',auth,admin,handler(async(req,res)=>{
 const d=z.object({paymentStatus:z.enum(['Chưa thanh toán','Đã thanh toán']),reference:z.string().trim().max(120).default(''),note:z.string().trim().max(500).default('')}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const old=await c.query('SELECT * FROM bookings WHERE code=$1 FOR UPDATE',[req.params.code]);if(!old.rowCount||old.rows[0].status==='Đã hủy'){await c.query('ROLLBACK');return fail(res,409,'Không thể xác nhận lịch đã hủy hoặc không tồn tại.');}
  const b=old.rows[0];if(b.payment_status===d.paymentStatus){await c.query('ROLLBACK');return fail(res,409,'Trạng thái thanh toán chưa thay đổi.');}
  if(d.paymentStatus==='Đã thanh toán'&&b.payment_method==='bank_transfer'&&!d.reference){await c.query('ROLLBACK');return fail(res,422,'Chuyển khoản phải nhập mã giao dịch ngân hàng đã đối soát.');}
  if(d.paymentStatus==='Đã thanh toán'&&b.payment_method==='bank_transfer'){
   // Serialize settlement events carrying the same real bank transaction reference.
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['petday-bank-ref',d.reference]);
   const duplicate=await c.query("SELECT 1 FROM payment_events e JOIN bookings existing ON existing.id=e.booking_id WHERE existing.payment_method='bank_transfer' AND e.new_status='Đã thanh toán' AND e.reference=$1 AND e.booking_id<>$2 LIMIT 1",[d.reference,b.id]);
   if(duplicate.rowCount){await c.query('ROLLBACK');return fail(res,409,'Mã giao dịch ngân hàng đã được dùng để đối soát một lịch khác. Vui lòng kiểm tra sao kê.');}
  }
  if(d.paymentStatus==='Chưa thanh toán'&&!d.note){await c.query('ROLLBACK');return fail(res,422,'Cần ghi lý do điều chỉnh thanh toán.');}
  if(d.paymentStatus==='Chưa thanh toán'){const refund=await c.query('SELECT 1 FROM refund_requests WHERE booking_id=$1 LIMIT 1',[b.id]);if(refund.rowCount){await c.query('ROLLBACK');return fail(res,409,'Lịch đã có hồ sơ hoàn tiền; không được đảo trạng thái thanh toán. Vui lòng xử lý qua sổ hoàn tiền.');}}
  const q=await c.query('UPDATE bookings SET payment_status=$1 WHERE id=$2 RETURNING code,payment_status',[d.paymentStatus,b.id]);
  await c.query('INSERT INTO payment_events(booking_id,admin_id,previous_status,new_status,reference,note) VALUES($1,$2,$3,$4,$5,$6)',[b.id,req.user.id,b.payment_status,d.paymentStatus,d.reference||null,d.note||null]);
  await notify(c,b.customer_id,'Thanh toán lịch '+b.code,'Trạng thái thanh toán: '+d.paymentStatus,b.code);
  await c.query('COMMIT');res.json(q.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.get('/api/admin/payments/audit',auth,admin,handler(async(req,res)=>{
 const q=await pool.query('SELECT e.id,b.code,e.previous_status AS "previousStatus",e.new_status AS "newStatus",e.reference,e.note,e.created_at AS "createdAt",u.full_name AS "adminName" FROM payment_events e JOIN bookings b ON b.id=e.booking_id JOIN users u ON u.id=e.admin_id ORDER BY e.id DESC LIMIT 100');res.json(q.rows);
}));

// V6.19: refundable-payment requests are an auditable approval process.
// No API here claims to send money: completed means a human has actually verified
// an external refund and recorded its reference or cash receipt.
const refundReason=z.string().trim().min(10).max(1000);
app.get('/api/my/refunds',auth,handler(async(req,res)=>{
 const r=await pool.query(`SELECT r.id,b.code,b.service,b.total,r.amount,r.reason,r.status,r.admin_note AS "adminNote",r.refund_reference AS "refundReference",r.created_at AS "createdAt",r.updated_at AS "updatedAt",r.completed_at AS "completedAt",to_char(b.booking_date,'YYYY-MM-DD') AS "appointmentDate",b.slot AS "appointmentSlot",b.branch AS "branch"
 FROM refund_requests r JOIN bookings b ON b.id=r.booking_id WHERE r.customer_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[req.user.id]);res.json(r.rows);
}));
app.post('/api/bookings/:code/refund-request',auth,handler(async(req,res)=>{
 const d=z.object({reason:refundReason}).strict().parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const q=await c.query('SELECT id,customer_id,total,payment_status,status FROM bookings WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch hẹn thuộc tài khoản.');}
 const b=q.rows[0];
 const prev=await c.query('SELECT id FROM refund_requests WHERE booking_id=$1',[b.id]);
 const issue=refundEligibility({paymentStatus:b.payment_status,status:b.status,total:b.total,existing:Boolean(prev.rowCount)});
 if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
 const r=await c.query(`INSERT INTO refund_requests(booking_id,customer_id,amount,reason) VALUES($1,$2,$3,$4)
 RETURNING id,status,amount`,[b.id,req.user.id,b.total,d.reason]);
 await notify(c,req.user.id,'Đã ghi nhận yêu cầu hoàn tiền · '+req.params.code,'PetDay sẽ kiểm tra yêu cầu. Gửi yêu cầu không đồng nghĩa được chấp thuận hoặc tiền đã hoàn.',req.params.code);
 await c.query('COMMIT');res.status(201).json(r.rows[0]);
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Lịch đã có yêu cầu hoàn tiền.');throw e;}finally{c.release();}
}));
// V6.92: Admin-only repair for PAID, cancelled, unserved appointments missing a refund case.
// Never marks a bank transfer/refund as completed. Unique booking_id prevents duplicates.
app.post('/api/admin/refunds/reconcile-missing',auth,admin,handler(async(req,res)=>{
 const c=await pool.connect();try{
  await c.query('BEGIN');
  // Serialize concurrent reconciliations without modifying already existing refund cases.
  await c.query('SELECT pg_advisory_xact_lock(6922026,1)');
  const inserted=await c.query(`INSERT INTO refund_requests(booking_id,customer_id,amount,reason)
    SELECT b.id,b.customer_id,b.total,
      CASE WHEN ns.booking_id IS NOT NULL THEN
        'Khôi phục hồ sơ: khách không đến, chưa sử dụng dịch vụ; hoàn 100% khoản đã thu.'
      ELSE 'Khôi phục hồ sơ: Admin đã hủy lịch chưa thực hiện dịch vụ; hoàn 100% khoản đã thu.' END
    FROM bookings b
    LEFT JOIN booking_no_shows ns ON ns.booking_id=b.id
    WHERE b.status='Đã hủy'
      AND b.payment_status='Đã thanh toán'
      AND b.total>0
      AND NOT EXISTS (SELECT 1 FROM service_events se WHERE se.booking_id=b.id)
      AND NOT EXISTS (SELECT 1 FROM care_records cr WHERE cr.booking_id=b.id)
    ON CONFLICT (booking_id) DO NOTHING
    RETURNING id,booking_id,customer_id`);
  for(const r of inserted.rows){
   const b=await c.query('SELECT code FROM bookings WHERE id=$1',[r.booking_id]);
   await notify(c,r.customer_id,'Đã bổ sung hồ sơ hoàn tiền · '+b.rows[0].code,
    'Lịch đã hủy và chưa sử dụng dịch vụ. PetDay đã mở hồ sơ hoàn 100% khoản đã ghi nhận; chờ Admin xử lý, chưa phải tiền đã được chuyển hoàn.',b.rows[0].code);
  }
  await c.query('COMMIT');res.json({ok:true,created:inserted.rowCount,message:inserted.rowCount?'Đã bổ sung '+inserted.rowCount+' hồ sơ hoàn tiền bị thiếu.':'Không có hồ sơ đủ điều kiện bị thiếu.'});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.get('/api/admin/refunds',auth,admin,handler(async(req,res)=>{
 const q=await pool.query(`SELECT r.id,b.code,b.service,b.payment_method AS "paymentMethod",b.total,r.amount,r.reason,r.status,r.admin_note AS "adminNote",r.refund_reference AS "refundReference",r.created_at AS "createdAt",r.updated_at AS "updatedAt",r.completed_at AS "completedAt",to_char(b.booking_date,'YYYY-MM-DD') AS "appointmentDate",b.slot AS "appointmentSlot",b.branch AS "branch",b.status AS "bookingStatus",u.full_name AS "customerName"
 FROM refund_requests r JOIN bookings b ON b.id=r.booking_id JOIN users u ON u.id=r.customer_id ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,r.created_at DESC LIMIT 200`);res.json(q.rows);
}));
app.patch('/api/admin/refunds/:id',auth,admin,handler(async(req,res)=>{
 const d=z.discriminatedUnion('decision',[
 z.object({decision:z.literal('approve'),note:z.string().trim().max(1000).default(''),amount:z.number().int().positive().optional()}),
 z.object({decision:z.literal('reject'),note:z.string().trim().min(8).max(1000)}),
 z.object({decision:z.literal('complete'),note:z.string().trim().max(1000).default(''),reference:z.string().trim().min(4).max(120)})
 ]).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const q=await c.query('SELECT r.*,b.code,b.status AS booking_status,b.payment_status,b.payment_method,b.total FROM refund_requests r JOIN bookings b ON b.id=r.booking_id WHERE r.id=$1 FOR UPDATE',[req.params.id]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy yêu cầu hoàn tiền.');}
 const r=q.rows[0];
 const next=d.decision==='approve'?'approved':d.decision==='reject'?'rejected':'completed';
 // V6.91: no service received -> full refund. Keep payment and refund ledgers separate.
 const unservedBooking=serviceNotProvided(r.booking_status);
 const servicePolicyIssue=fullRefundDecisionIssue({mandatory:unservedBooking,decision:d.decision,amount:d.decision==='approve'?d.amount:undefined,total:r.total});
 if(servicePolicyIssue){await c.query('ROLLBACK');return fail(res,409,servicePolicyIssue);}
 const issue=refundDecisionIssue(r.status,d.decision,r.payment_status==='Đã thanh toán');
 if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
 // An approval may choose a partial refund, never more than the recorded receipt.
 const amount=unservedBooking?Number(r.total):(d.decision==='approve'&&d.amount!==undefined?d.amount:Number(r.amount));
 const amountIssue=refundAmountIssue(amount,r.total,d.decision==='approve'?d.note:'Đã xử lý');
 if(amountIssue){await c.query('ROLLBACK');return fail(res,422,amountIssue);}
 const updated=await c.query(`UPDATE refund_requests SET status=$1,admin_note=$2,refund_reference=CASE WHEN $1='completed' THEN $3 ELSE refund_reference END,processed_by=$4,updated_at=now(),completed_at=CASE WHEN $1='completed' THEN now() ELSE completed_at END,amount=CASE WHEN $1='approved' THEN $6 ELSE amount END WHERE id=$5 RETURNING id,status,amount`,[next,d.note,d.decision==='complete'?d.reference:null,req.user.id,r.id,amount]);
 await c.query('INSERT INTO refund_events(refund_id,actor_id,previous_status,new_status,note,reference) VALUES($1,$2,$3,$4,$5,$6)',[r.id,req.user.id,r.status,next,d.note,d.decision==='complete'?d.reference:null]);
 await notify(c,r.customer_id,'Cập nhật hoàn tiền · '+r.code,next==='completed'?'PetDay đã ghi nhận hoàn tiền thực tế. Mã đối soát: '+d.reference:next==='approved'?'Yêu cầu đã được duyệt với số tiền '+amount.toLocaleString('vi-VN')+'đ, đang chờ xử lý hoàn tiền.':'Yêu cầu hoàn tiền chưa được chấp thuận. Xem ghi chú trong lịch sử.',r.code);
 await c.query('COMMIT');res.json(updated.rows[0]);
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Mã tham chiếu hoàn tiền đã được sử dụng cho yêu cầu khác.');throw e;}finally{c.release();}
}));
// Admin ledger: booking amounts are not recognized as receipts until marked paid.
// Refunds only reduce net receipts when explicitly marked completed.
app.get('/api/admin/finance/summary',auth,admin,handler(async(req,res)=>{
 const q=await pool.query(`SELECT
 COALESCE((SELECT SUM(total) FROM bookings WHERE payment_status='Đã thanh toán'),0)::bigint AS "grossReceived",
 COALESCE((SELECT SUM(amount) FROM refund_requests WHERE status='completed'),0)::bigint AS "refunded",
 (SELECT COUNT(*)::int FROM refund_requests WHERE status='pending') AS "pendingRefunds",
 (SELECT COUNT(*)::int FROM refund_requests WHERE status='approved') AS "approvedUnpaid"`);
 const r=q.rows[0];res.json({...r,netReceived:String(BigInt(r.grossReceived)-BigInt(r.refunded)),currency:'VND',basis:'Manual payment confirmations less completed external refunds; cumulative, not a bank statement.'});
}));

// Reschedule request workflow: customer proposes; admin verifies capacity and accepts/rejects.
app.get('/api/reschedule-requests',auth,handler(async(req,res)=>{
 const where=req.user.role==='admin'?'':'WHERE r.requested_by=$1';
 const q=`SELECT r.id,r.booking_id,r.proposed_date::text AS "proposedDate",r.proposed_slot AS "proposedSlot",r.reason,r.status,r.created_at AS "createdAt",r.resolved_at AS "resolvedAt",b.code AS "bookingCode",b.branch,b.service FROM booking_reschedule_requests r JOIN bookings b ON b.id=r.booking_id ${where} ORDER BY r.created_at DESC LIMIT 150`;
 const out=await pool.query(q,req.user.role==='admin'?[]:[req.user.id]);res.json(out.rows);
}));
app.post('/api/bookings/:code/reschedule',auth,handler(async(req,res)=>{
 const d=z.object({date:z.string(),slot:z.string(),reason:z.string().trim().min(5).max(500)}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const b=await c.query('SELECT * FROM bookings WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
 if(!b.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch hẹn của bạn.');}
 const row=b.rows[0];if(!['Đang chờ xác nhận','Đã xác nhận'].includes(row.status)) {await c.query('ROLLBACK');return fail(res,409,'Lịch đã bắt đầu hoặc kết thúc, không thể đổi lịch.');}
 if(!validFutureDate(d.date)||!validSlot(row.service,d.slot)) {await c.query('ROLLBACK');return fail(res,400,'Ngày hoặc khung giờ mới không hợp lệ.');}
 if(row.booking_date.toISOString().slice(0,10)===d.date&&row.slot===d.slot){await c.query('ROLLBACK');return fail(res,400,'Vui lòng chọn thời gian khác lịch hiện tại.');}
 const pending=await c.query("SELECT id FROM booking_reschedule_requests WHERE booking_id=$1 AND status='pending' LIMIT 1",[row.id]);
 if(pending.rowCount){await c.query('ROLLBACK');return fail(res,409,'Lịch đã có yêu cầu đổi giờ đang chờ xử lý.');}
 const r=await c.query('INSERT INTO booking_reschedule_requests(booking_id,requested_by,proposed_date,proposed_slot,reason) VALUES($1,$2,$3,$4,$5) RETURNING id,status',[row.id,req.user.id,d.date,d.slot,d.reason]);
 await c.query('COMMIT');res.status(201).json(r.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.patch('/api/admin/reschedule-requests/:id',auth,admin,handler(async(req,res)=>{
 const {decision}=z.object({decision:z.enum(['approved','rejected'])}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const r=await c.query('SELECT * FROM booking_reschedule_requests WHERE id=$1 FOR UPDATE',[req.params.id]);
 if(!r.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy yêu cầu.');}
 const request=r.rows[0];if(request.status!=='pending'){await c.query('ROLLBACK');return fail(res,409,'Yêu cầu đã được xử lý.');}
 const b=await c.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE',[request.booking_id]);const booking=b.rows[0];
 if(!booking||!['Đang chờ xác nhận','Đã xác nhận'].includes(booking.status)) {await c.query('ROLLBACK');return fail(res,409,'Lịch không còn đủ điều kiện đổi.');}
 if(decision==='approved'){
  const newDate=request.proposed_date.toISOString().slice(0,10),newSlot=request.proposed_slot;
  if(!validFutureDate(newDate)||!validSlot(booking.service,newSlot)){await c.query('ROLLBACK');return fail(res,409,'Thời gian yêu cầu đã không còn hợp lệ.');}
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[booking.branch,newDate+' '+newSlot]);
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['petday-pet-'+booking.pet_id,newDate]);
  const otherPetBookings=await c.query("SELECT service,slot FROM bookings WHERE pet_id=$1 AND booking_date=$2 AND id<>$3 AND status NOT IN ('Đã hủy','Không đến')",[booking.pet_id,newDate,booking.id]);
  if(otherPetBookings.rows.some(other=>servicesOverlap(other.service,other.slot,booking.service,newSlot))){await c.query('ROLLBACK');return fail(res,409,'Không thể duyệt: thú cưng đã có lịch khác trùng thời gian trên ngày mới.');}
  const closed=await c.query('SELECT 1 FROM blocked_slots WHERE branch=$1 AND booking_date=$2 AND slot=$3',[booking.branch,newDate,newSlot]);if(closed.rowCount){await c.query('ROLLBACK');return fail(res,409,'Khung giờ đề nghị đã được khóa, không thể duyệt.');}const cap=booking.branch==='PetDay Phú Mỹ Hưng'?Math.max(2,slots[newSlot]-1):slots[newSlot];
  const used=await c.query("SELECT COALESCE(SUM(CASE WHEN service IN ('Grooming tạo kiểu','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông','Daycare cả ngày') THEN 2 ELSE 1 END),0)::int AS used FROM bookings WHERE branch=$1 AND booking_date=$2 AND slot=$3 AND status <> 'Đã hủy' AND id<>$4",[booking.branch,newDate,newSlot,booking.id]);
  if(used.rows[0].used+services[booking.service].units>cap){await c.query('ROLLBACK');return fail(res,409,'Khung giờ mới đã hết chỗ. Không thể duyệt.');}
  await releaseStaff(c,booking.id,req.user.id,'Lịch được duyệt đổi ngày hoặc giờ');await c.query('UPDATE bookings SET booking_date=$1,slot=$2 WHERE id=$3',[newDate,newSlot,booking.id]);
  const taxiReschedule=await c.query("UPDATE pet_taxi_requests SET status='requested',updated_at=now(),updated_by=$2 WHERE booking_id=$1 AND status<>'requested' RETURNING id",[booking.id,req.user.id]);
  if(taxiReschedule.rowCount)await notify(c,booking.customer_id,'Pet Taxi cần xác nhận lại','Lịch vừa được đổi ngày/giờ; PetDay sẽ điều phối lại chuyến đón trước khi phục vụ.',booking.code);
 }
 await c.query('UPDATE booking_reschedule_requests SET status=$1,resolved_at=now() WHERE id=$2',[decision,request.id]);
 await notify(c,booking.customer_id,'Yêu cầu đổi lịch '+booking.code,decision==='approved'?'Đã duyệt thời gian mới.':'Yêu cầu đổi lịch chưa được chấp thuận.',booking.code);
 await c.query('COMMIT');res.json({id:request.id,status:decision});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// V6.28 - Confirmed appointment cancellation request. No automatic refunds or payment status changes.
app.get('/api/cancellation-requests',auth,handler(async(req,res)=>{
 const filter=req.user.role==='admin'?'':'WHERE r.customer_id=$1';
 if(req.user.role==='staff')return fail(res,403,'Không có quyền xem yêu cầu hủy lịch.');
 const q=`SELECT r.id,r.reason,r.status,r.admin_note AS "adminNote",r.created_at AS "createdAt",r.resolved_at AS "resolvedAt",b.code AS "bookingCode",b.service,to_char(b.booking_date,'YYYY-MM-DD') AS date,b.slot,b.payment_status AS "paymentStatus",b.total
  FROM booking_cancellation_requests r JOIN bookings b ON b.id=r.booking_id ${filter} ORDER BY r.created_at DESC LIMIT 150`;
 const out=await pool.query(q,req.user.role==='admin'?[]:[req.user.id]);res.json(out.rows);
}));
app.post('/api/bookings/:code/cancellation-request',auth,handler(async(req,res)=>{
 if(req.user.role!=='customer')return fail(res,403,'Chỉ khách hàng được gửi yêu cầu.');
 const d=z.object({reason:z.string().trim().min(10).max(800)}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const r=await c.query('SELECT * FROM bookings WHERE code=$1 AND customer_id=$2 FOR UPDATE',[req.params.code,req.user.id]);
  if(!r.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch của bạn.');}
  const b=r.rows[0];
  const pending=await c.query("SELECT 1 FROM booking_cancellation_requests WHERE booking_id=$1 AND status='pending'",[b.id]);
  const localToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const issue=cancellationRequestIssue({role:req.user.role,status:b.status,bookingDate:b.booking_date.toISOString().slice(0,10),today:localToday,alreadyPending:pending.rowCount>0,paid:b.payment_status==='Đã thanh toán'});
  if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
  const out=await c.query('INSERT INTO booking_cancellation_requests(booking_id,customer_id,reason) VALUES($1,$2,$3) RETURNING id,status',[b.id,req.user.id,d.reason]);
  await c.query('COMMIT');res.status(201).json(out.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.patch('/api/admin/cancellation-requests/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({decision:z.enum(['approved','rejected']),note:z.string().trim().min(8).max(800)}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const r=await c.query('SELECT * FROM booking_cancellation_requests WHERE id=$1 FOR UPDATE',[req.params.id]);
  if(!r.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không thấy yêu cầu.');}
  const request=r.rows[0];
  if(request.status!=='pending'){await c.query('ROLLBACK');return fail(res,409,'Yêu cầu đã được xử lý.');}
  const b=await c.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE',[request.booking_id]);
  const booking=b.rows[0];
  if(!booking){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch.');}
  const events=await c.query("SELECT 1 FROM service_events WHERE booking_id=$1 LIMIT 1",[booking.id]);
  const issue=cancellationDecisionIssue({requestStatus:request.status,bookingStatus:booking.status,hasCareEvents:events.rowCount>0});
  if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
  if(d.decision==='approved'){
   await releaseStaff(c,booking.id,req.user.id,'Duyệt yêu cầu hủy lịch của khách');
   await c.query("UPDATE bookings SET status='Đã hủy' WHERE id=$1",[booking.id]);
   await c.query("UPDATE pet_taxi_requests SET status='cancelled',updated_by=$2,updated_at=now() WHERE booking_id=$1 AND status IN ('requested','confirmed')",[booking.id,req.user.id]);
   await c.query("UPDATE booking_reschedule_requests SET status='rejected',resolved_at=now() WHERE booking_id=$1 AND status='pending'",[booking.id]);
   // V6.82: create the refund case atomically with a paid cancellation.
   // This is an AUDITABLE REQUEST, not a claim that money was transferred.
   // Unique booking_id prevents duplicate refund cases on concurrent requests.
   if(booking.payment_status==='Đã thanh toán'){
    const amount=Number(booking.total);
    if(!Number.isSafeInteger(amount)||amount<=0){await c.query('ROLLBACK');return fail(res,409,'Không thể xác định số tiền hoàn. Vui lòng kiểm tra khoản thu trước khi duyệt hủy.');}
    const reason='Hoàn tiền sau khi duyệt hủy lịch '+booking.code+'. Lý do khách: '+request.reason;
    const refund=await c.query(`INSERT INTO refund_requests(booking_id,customer_id,amount,reason)
      VALUES($1,$2,$3,$4) ON CONFLICT (booking_id) DO NOTHING RETURNING id`,
     [booking.id,booking.customer_id,amount,reason]);
    if(refund.rowCount)await notify(c,booking.customer_id,'Đã mở hồ sơ hoàn tiền · '+booking.code,'Yêu cầu hủy đã được duyệt. Hồ sơ hoàn tiền đang chờ Admin kiểm tra, chưa có khoản hoàn thực tế.',booking.code);
   }
  }
  await c.query('UPDATE booking_cancellation_requests SET status=$1,admin_note=$2,resolved_at=now(),resolved_by=$3 WHERE id=$4',[d.decision,d.note,req.user.id,request.id]);
  const paymentInfo=booking.payment_status==='Đã thanh toán'&&d.decision==='approved'?' Hồ sơ hoàn tiền đã được tạo và đang chờ Admin xem xét; chưa có tiền được hoàn.':'';
  await notify(c,booking.customer_id,'Yêu cầu hủy lịch '+booking.code,d.decision==='approved'?'Đã chấp thuận yêu cầu hủy. '+d.note+paymentInfo:'Chưa chấp thuận yêu cầu hủy. '+d.note,booking.code);
  await c.query('COMMIT');res.json({id:request.id,status:d.decision});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));

app.patch('/api/bookings/:code/cancel',auth,handler(async(req,res)=>{
 const c=await pool.connect();try{await c.query('BEGIN');
 const r=await c.query("UPDATE bookings SET status='Đã hủy' WHERE code=$1 AND customer_id=$2 AND status='Đang chờ xác nhận' AND payment_status='Chưa thanh toán' RETURNING *",[req.params.code,req.user.id]);
 if(!r.rowCount){await c.query('ROLLBACK');return fail(res,409,'Lịch đã thanh toán cần gửi yêu cầu hủy để Admin xử lý hoàn tiền. Chỉ tự hủy lịch chờ xác nhận chưa thanh toán.');}
 await releaseStaff(c,r.rows[0].id,req.user.id,'Khách hủy lịch chờ xác nhận');
 await notify(c,req.user.id,'Lịch đã hủy '+req.params.code,'Yêu cầu hủy lịch đã được ghi nhận.',req.params.code);
 await c.query('COMMIT');res.json(r.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.put('/api/bookings/:code/care',auth,admin,handler(async(req,res)=>{const d=z.object({notes:z.string().trim().min(1).max(3000),careDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(req.body);const r=await pool.query('INSERT INTO care_records(booking_id,notes,care_date) SELECT id,$2,$3 FROM bookings WHERE code=$1 AND status=$4 ON CONFLICT(booking_id) DO UPDATE SET notes=EXCLUDED.notes,care_date=EXCLUDED.care_date RETURNING *',[req.params.code,d.notes,d.careDate,'Hoàn tất']);if(!r.rows.length)return fail(res,409,'Chỉ tạo nhật ký cho lịch hoàn tất.');res.json(r.rows[0]);}));
app.post('/api/bookings/:code/review',auth,handler(async(req,res)=>{const d=z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().min(1).max(2000)}).parse(req.body);try{const r=await pool.query('INSERT INTO reviews(booking_id,customer_id,rating,comment) SELECT id,$2,$3,$4 FROM bookings WHERE code=$1 AND customer_id=$2 AND status=$5 RETURNING *',[req.params.code,req.user.id,d.rating,d.comment,'Hoàn tất']);if(!r.rows.length)return fail(res,409,'Lịch chưa hoàn tất hoặc không thuộc tài khoản.');res.status(201).json(r.rows[0]);}catch(e){if(e.code==='23505')return fail(res,409,'Lịch này đã được đánh giá.');throw e;}}));

// Administrator can attach a real JPG/PNG/WebP to a care milestone. Uploaded image
// remains optional; customers can see it only when they can read the related timeline.
// V6.14: tracked care milestones. The audit trail is append-only and belongs to a real booking.
// Customer can inspect only their own booking; admins can view all.
app.get('/api/bookings/:code/timeline',auth,handler(async(req,res)=>{
 const b=await pool.query('SELECT id,customer_id,code,status FROM bookings WHERE code=$1',[req.params.code]);
 if(!b.rowCount)return fail(res,404,'Không tìm thấy lịch hẹn.');
 if(req.user.role==='customer'&&Number(b.rows[0].customer_id)!==Number(req.user.id))return fail(res,403,'Bạn không có quyền xem lịch này.');
 if(req.user.role==='staff'){
  const assigned=await pool.query('SELECT 1 FROM booking_assignments a JOIN staff_members m ON m.id=a.staff_id WHERE a.booking_id=$1 AND m.user_id=$2 AND m.active=true',[b.rows[0].id,req.user.id]);
  if(!assigned.rowCount)return fail(res,403,'Lịch không thuộc phân công của bạn.');
 }
 const rows=await pool.query(`SELECT e.id,e.event_type AS "eventType",e.note,e.photo_url AS "photoUrl",e.created_at AS "createdAt",u.full_name AS "recordedBy",m.full_name AS "assignedStaff"
 FROM service_events e JOIN users u ON u.id=e.created_by LEFT JOIN booking_assignments a ON a.booking_id=e.booking_id LEFT JOIN staff_members m ON m.id=a.staff_id
 WHERE e.booking_id=$1 ORDER BY e.id ASC`,[b.rows[0].id]);
 res.json({bookingCode:b.rows[0].code,status:b.rows[0].status,events:rows.rows});
}));
app.post(['/api/admin/bookings/:code/milestone','/api/staff/bookings/:code/milestone'],auth,careOperator,handler(async(req,res)=>{
 const d=z.object({eventType:z.enum(['check_in','care_update','ready','check_out']),note:z.string().trim().max(1200).default(''),photoUrl:z.string().regex(/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/).optional()}).strict().parse(req.body);
 const c=await pool.connect();
 try{await c.query('BEGIN');
  const q=await c.query('SELECT * FROM bookings WHERE code=$1 FOR UPDATE',[req.params.code]);
  if(!q.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch.');}
  const b=q.rows[0];
  // Recheck assignment after acquiring the booking row lock (dispatch may have changed).
  if(req.user.role==='staff'){
   const own=await c.query('SELECT 1 FROM booking_assignments a JOIN staff_members m ON m.id=a.staff_id WHERE a.booking_id=$1 AND m.active=true AND m.user_id=$2',[b.id,req.user.id]);
   if(!own.rowCount){await c.query('ROLLBACK');return fail(res,403,'Lịch đã được điều phối lại cho nhân viên khác.');}
  }
  const current=await c.query('SELECT event_type FROM service_events WHERE booking_id=$1 ORDER BY id',[b.id]);
  const types=current.rows.map(x=>x.event_type);
  const has=(type)=>types.includes(type);
  if(b.status==='Đã hủy'){await c.query('ROLLBACK');return fail(res,409,'Lịch đã hủy không thể ghi nhận chăm sóc.');}
  if(d.eventType==='check_in'&&b.payment_method==='bank_transfer'&&b.payment_status!=='Đã thanh toán'){await c.query('ROLLBACK');return fail(res,409,'Lịch chuyển khoản chưa được xác nhận thanh toán, không thể bắt đầu dịch vụ.');}
  if(d.eventType==='check_in'){
   if(b.status!=='Đã xác nhận'){await c.query('ROLLBACK');return fail(res,409,'Lịch phải được duyệt trước khi tiếp nhận.');}
   const taxi=await c.query('SELECT status FROM pet_taxi_requests WHERE booking_id=$1',[b.id]);
   if(taxi.rowCount&&taxi.rows[0].status!=='completed'){await c.query('ROLLBACK');return fail(res,409,'Lịch có Pet Taxi: cần xác nhận đã đưa thú cưng đến cơ sở trước khi check-in.');}
   const staffed=await c.query('SELECT 1 FROM staff_members WHERE active=true AND branch=$1 LIMIT 1',[b.branch]);
   if(staffed.rowCount){const assigned=await c.query('SELECT 1 FROM booking_assignments WHERE booking_id=$1',[b.id]);
     if(!assigned.rowCount){await c.query('ROLLBACK');return fail(res,409,'Cơ sở đã thiết lập nhân viên. Vui lòng phân công nhân viên trước khi check-in.');}
   }
  }
  const stepIssue=careStepIssue(d.eventType,{status:b.status,hasCheckIn:has('check_in'),hasCareUpdate:has('care_update'),hasReady:has('ready'),hasCheckOut:has('check_out')});
  if(stepIssue){await c.query('ROLLBACK');return fail(res,409,stepIssue);}
  if(d.photoUrl){try{await (await import('node:fs/promises')).access(new URL('../uploads/'+d.photoUrl.split('/').pop(),import.meta.url));}catch{await c.query('ROLLBACK');return fail(res,422,'Ảnh chưa được tải lên máy chủ.');}}
  const milestoneTitles={check_in:'Bắt đầu dịch vụ',care_update:'Cập nhật chăm sóc',ready:'Sẵn sàng bàn giao',check_out:'Hoàn tất dịch vụ'};
  const recordedNote=d.note||milestoneTitles[d.eventType];
  const created=await c.query('INSERT INTO service_events(booking_id,event_type,note,created_by,photo_url) VALUES($1,$2,$3,$4,$5) RETURNING id,event_type,created_at,photo_url',[b.id,d.eventType,recordedNote,req.user.id,d.photoUrl||null]);
  if(d.eventType==='check_in')await c.query("UPDATE bookings SET status='Đang thực hiện' WHERE id=$1",[b.id]);
  if(d.eventType==='check_out')await c.query("UPDATE bookings SET status='Hoàn tất' WHERE id=$1",[b.id]);
  const names={check_in:'Đã tiếp nhận thú cưng',care_update:'Cập nhật chăm sóc',ready:'Sẵn sàng bàn giao',check_out:'Đã bàn giao và hoàn tất'};
  await notify(c,b.customer_id,names[d.eventType]+' · '+b.code,recordedNote,b.code);
  await c.query('COMMIT');res.status(201).json(created.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));

// STAFF PLANNER (back-office only). Staff entries are operational profiles, NOT login accounts.
const staffBranches=['PetDay Thảo Điền','PetDay Phú Mỹ Hưng'];
const staffSlots=['08:30','10:00','13:30','15:00','17:30'];
app.get('/api/admin/staff',auth,admin,handler(async(req,res)=>{
 const [members,shifts]=await Promise.all([
  pool.query('SELECT id,full_name AS "fullName",branch,active,created_at AS "createdAt" FROM staff_members ORDER BY active DESC,branch,full_name'),
  pool.query("SELECT s.id,s.staff_id AS \"staffId\",s.shift_date::text AS date,s.slot,m.full_name AS \"staffName\",m.branch FROM staff_shifts s JOIN staff_members m ON m.id=s.staff_id WHERE s.shift_date>=current_date-interval '7 days' ORDER BY s.shift_date,s.slot LIMIT 500")
 ]);res.json({members:members.rows,shifts:shifts.rows});
}));
// V6.67: Create only missing demo staff profiles on explicit admin action; never create login accounts.
app.post('/api/admin/staff/defaults',auth,admin,handler(async(req,res)=>{
 const names=['Thanh Lam','Thiên Ân','Phụng Anh','Bảo Yến'];
 const branch='PetDay Thảo Điền';
 const c=await pool.connect();let created=0;
 try{await c.query('BEGIN');
  await c.query("SELECT pg_advisory_xact_lock(hashtext('petday-default-staff'))");
  for(const fullName of names){const existing=await c.query("SELECT id FROM staff_members WHERE lower(trim(full_name))=lower($1) OR ($1='Thanh Lam' AND lower(trim(full_name))='nguyễn thanh lam') LIMIT 1",[fullName]);
   if(!existing.rowCount){await c.query('INSERT INTO staff_members(full_name,branch,active) VALUES($1,$2,true)',[fullName,branch]);created++;}
  }
  await c.query('COMMIT');res.json({created,names,notice:'Hồ sơ nhân viên chỉ dùng để phân công, không tạo tài khoản đăng nhập.'});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.post('/api/admin/staff',auth,admin,handler(async(req,res)=>{
 const d=z.object({fullName:z.string().trim().min(2).max(100),branch:z.enum(staffBranches)}).parse(req.body);
 const q=await pool.query('INSERT INTO staff_members(full_name,branch) VALUES($1,$2) RETURNING id,full_name AS "fullName",branch,active',[d.fullName,d.branch]);res.status(201).json(q.rows[0]);
}));
app.patch('/api/admin/staff/:id',auth,admin,handler(async(req,res)=>{
 const d=z.object({active:z.boolean().optional(),fullName:z.string().trim().min(2).max(100).optional(),branch:z.enum(staffBranches).optional()}).refine(v=>Object.keys(v).length>0).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
  const member=await c.query('SELECT * FROM staff_members WHERE id=$1 FOR UPDATE',[req.params.id]);if(!member.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy nhân viên.');}
  if(d.active===false){const assigned=await c.query("SELECT 1 FROM booking_assignments a JOIN bookings b ON b.id=a.booking_id WHERE a.staff_id=$1 AND b.status IN ('Đã xác nhận','Đang thực hiện') LIMIT 1",[req.params.id]);if(assigned.rowCount){await c.query('ROLLBACK');return fail(res,409,'Còn lịch đang phục vụ. Vui lòng phân công lại trước khi ngừng nhân viên.');}}
  const r=await c.query('UPDATE staff_members SET active=COALESCE($1,active),full_name=COALESCE($2,full_name),branch=COALESCE($3,branch) WHERE id=$4 RETURNING id,full_name AS \"fullName\",branch,active',[d.active??null,d.fullName??null,d.branch??null,req.params.id]);await c.query('COMMIT');res.json(r.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Remove only a truly unused staff profile. Historical audit, assignments and login accounts are preserved.
app.delete('/api/admin/staff/:id',auth,admin,handler(async(req,res)=>{
 const id=z.coerce.number().int().positive().parse(req.params.id);
 const c=await pool.connect();try{await c.query('BEGIN');
 const member=await c.query('SELECT id,user_id FROM staff_members WHERE id=$1 FOR UPDATE',[id]);
 if(!member.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy hồ sơ nhân viên.');}
 const q=await c.query(`SELECT
 (SELECT count(*)::int FROM staff_shifts WHERE staff_id=$1) AS shifts,
 (SELECT count(*)::int FROM booking_assignments WHERE staff_id=$1) AS assignments,
 (SELECT count(*)::int FROM staff_assignment_events WHERE staff_id=$1) AS history`,[id]);
 const usage=q.rows[0];
 if(member.rows[0].user_id||usage.shifts||usage.assignments||usage.history){
  await c.query('ROLLBACK');return fail(res,409,'Hồ sơ đã có tài khoản, ca trực hoặc lịch sử phân công; chỉ được Ngừng hoạt động để bảo toàn dữ liệu.');
 }
 await c.query('DELETE FROM staff_members WHERE id=$1',[id]);await c.query('COMMIT');res.json({ok:true});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23503')return fail(res,409,'Hồ sơ có dữ liệu liên quan; chỉ được Ngừng hoạt động.');throw e;}finally{c.release();}
}));

app.post('/api/admin/staff/shifts',auth,admin,handler(async(req,res)=>{
 const d=z.object({staffId:z.coerce.number().int().positive(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),slot:z.enum(staffSlots)}).parse(req.body);
 if(!validFutureDate(d.date)&&d.date!==new Date().toISOString().slice(0,10))return fail(res,400,'Ca làm phải là ngày hiện tại hoặc tương lai.');
 const c=await pool.connect();try{await c.query('BEGIN');
 const member=await c.query('SELECT id FROM staff_members WHERE id=$1 AND active=true FOR UPDATE',[d.staffId]);if(!member.rowCount){await c.query('ROLLBACK');return fail(res,409,'Nhân viên chưa hoạt động.');}
 const q=await c.query('INSERT INTO staff_shifts(staff_id,shift_date,slot) VALUES($1,$2,$3) ON CONFLICT(staff_id,shift_date,slot) DO NOTHING RETURNING id',[d.staffId,d.date,d.slot]);
 if(!q.rowCount){await c.query('ROLLBACK');return fail(res,409,'Ca làm này đã tồn tại.');}
 await c.query('COMMIT');res.status(201).json(q.rows[0]);
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Generate a short duty roster for existing staff. No example accounts or fake staff are created.
app.post('/api/admin/staff/shifts/generate',auth,admin,handler(async(req,res)=>{
 const d=z.object({days:z.coerce.number().int().min(1).max(30).default(14),staffIds:z.array(z.coerce.number().int().positive()).min(1).max(30)}).parse(req.body);
 const unique=[...new Set(d.staffIds)];
 const c=await pool.connect();try{await c.query('BEGIN');
 const members=await c.query('SELECT id FROM staff_members WHERE active=true AND id=ANY($1::int[])',[unique]);
 if(members.rowCount!==unique.length){await c.query('ROLLBACK');return fail(res,422,'Có nhân viên không tồn tại hoặc đã ngừng làm việc.');}
 let added=0;
 for(const m of members.rows){for(let offset=0;offset<d.days;offset++){for(const slot of staffSlots){
 const r=await c.query("INSERT INTO staff_shifts(staff_id,shift_date,slot) VALUES($1,(current_date + $2::int),$3) ON CONFLICT(staff_id,shift_date,slot) DO NOTHING RETURNING id",[m.id,offset,slot]);added+=r.rowCount;
 }}}
 await c.query('COMMIT');res.status(201).json({ok:true,added,days:d.days,staffCount:unique.length});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
// Reconcile already-confirmed unassigned bookings after generating shifts.
app.post('/api/admin/staff/auto-assign',auth,admin,handler(async(req,res)=>{
 const c=await pool.connect();let assigned=0,pending=0;
 try{await c.query('BEGIN');
 const q=await c.query(`SELECT b.* FROM bookings b LEFT JOIN booking_assignments a ON a.booking_id=b.id
 WHERE b.status='Đã xác nhận' AND a.booking_id IS NULL AND b.booking_date>=current_date
 ORDER BY b.booking_date,b.slot,b.id LIMIT 200 FOR UPDATE OF b`);
 for(const booking of q.rows){const person=await autoAssignConfirmed(c,booking,req.user.id);if(person)assigned++;else pending++;}
 await c.query('COMMIT');res.json({assigned,pending});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.delete('/api/admin/staff/shifts/:id',auth,admin,handler(async(req,res)=>{
 const c=await pool.connect();try{await c.query('BEGIN');
 const sh=await c.query('SELECT * FROM staff_shifts WHERE id=$1 FOR UPDATE',[req.params.id]);if(!sh.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy ca làm.');}
 const row=sh.rows[0];const busy=await c.query('SELECT 1 FROM booking_assignments WHERE staff_id=$1 AND booking_date=$2 AND slot=$3',[row.staff_id,row.shift_date,row.slot]);if(busy.rowCount){await c.query('ROLLBACK');return fail(res,409,'Ca đã phân công cho lịch hẹn. Hãy điều phối lại trước khi xóa ca.');}
 await c.query('DELETE FROM staff_shifts WHERE id=$1',[row.id]);await c.query('COMMIT');res.json({ok:true});
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}));
app.patch('/api/admin/bookings/:code/assign',auth,admin,handler(async(req,res)=>{
 const d=z.object({staffId:z.coerce.number().int().positive()}).parse(req.body);
 const c=await pool.connect();try{await c.query('BEGIN');
 const bq=await c.query('SELECT * FROM bookings WHERE code=$1 FOR UPDATE',[req.params.code]);if(!bq.rowCount){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy lịch.');}
 const b=bq.rows[0];if(!['Đã xác nhận'].includes(b.status)){await c.query('ROLLBACK');return fail(res,409,'Chỉ phân công lịch đã xác nhận nhưng chưa check-in.');}
 // Serializes assignment decisions for a given staff shift to avoid scheduling races.
 await c.query('SELECT pg_advisory_xact_lock($1)',[d.staffId]);
 const staff=await c.query('SELECT id,full_name,branch FROM staff_members WHERE id=$1 AND active=true FOR UPDATE',[d.staffId]);
 if(!staff.rowCount||staff.rows[0].branch!==b.branch){await c.query('ROLLBACK');return fail(res,422,'Nhân viên không hoạt động hoặc không thuộc chi nhánh lịch.');}
 // V6.67: simplified manual assignment does not require a generated staff shift.
 const current=await c.query('SELECT staff_id FROM booking_assignments WHERE booking_id=$1 FOR UPDATE',[b.id]);
 if(current.rowCount&&Number(current.rows[0].staff_id)===d.staffId){await c.query('ROLLBACK');return fail(res,409,'Nhân viên này đã được phân công cho lịch.');}
 const clash=await c.query(`SELECT other.service,other.slot FROM booking_assignments a JOIN bookings other ON other.id=a.booking_id
 WHERE a.staff_id=$1 AND a.booking_date=$2 AND a.booking_id<>$3 AND other.status IN ('Đã xác nhận','Đang thực hiện')`,[d.staffId,b.booking_date,b.id]);
 const isBusy=clash.rows.some(other=>servicesOverlap(b.service,b.slot,other.service,other.slot));
 const issue=staffAssignmentIssue({bookingStatus:b.status,staffActive:true,bookingBranch:b.branch,staffBranch:staff.rows[0].branch,hasShift:true,isBusy});
 if(issue){await c.query('ROLLBACK');return fail(res,409,issue);}
 if(current.rowCount)await releaseStaff(c,b.id,req.user.id,'Điều phối lại nhân viên');
 const result=await c.query('INSERT INTO booking_assignments(booking_id,staff_id,booking_date,slot,assigned_by) VALUES($1,$2,$3,$4,$5) RETURNING booking_id',[b.id,d.staffId,b.booking_date,b.slot,req.user.id]);
 await c.query('INSERT INTO staff_assignment_events(booking_id,staff_id,action,changed_by,note) VALUES($1,$2,$3,$4,$5)',[b.id,d.staffId,'assigned',req.user.id,'Phân công lịch tại cơ sở']);
 await notify(c,b.customer_id,'Nhân viên phụ trách lịch '+b.code,'PetDay đã phân công '+staff.rows[0].full_name+' phụ trách lịch chăm sóc.',b.code);
 await c.query('COMMIT');res.json({bookingCode:b.code,staffName:staff.rows[0].full_name,...result.rows[0]});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Nhân viên hoặc lịch vừa được phân công. Vui lòng tải lại.');throw e;}finally{c.release();}
}));
app.get('/api/admin/staff/assignments',auth,admin,handler(async(req,res)=>{
 const q=await pool.query('SELECT e.id,b.code,m.full_name AS "staffName",e.action,e.note,e.created_at AS "createdAt" FROM staff_assignment_events e JOIN bookings b ON b.id=e.booking_id JOIN staff_members m ON m.id=e.staff_id ORDER BY e.id DESC LIMIT 100');res.json(q.rows);
}));

// One independent Staff login for demo operations; staff_members remain assignment-only profiles.
app.post('/api/admin/staff/operator-access',auth,admin,handler(async(req,res)=>{
 const d=z.object({email:emailSchema,initialPassword:z.string().min(12).max(128)}).strict().parse(req.body);
 const existing=await pool.query('SELECT id FROM users WHERE email=$1',[d.email]);
 if(existing.rowCount)return fail(res,409,'Email đã có tài khoản; đăng nhập bằng tài khoản Staff đã có, hoặc chọn email khác.');
 const hash=await bcrypt.hash(d.initialPassword,12);
 try{const result=await pool.query("INSERT INTO users(email,full_name,password_hash,role) VALUES($1,'Nhân viên vận hành PetDay',$2,'staff') RETURNING id,email",[d.email,hash]);
 res.status(201).json({id:result.rows[0].id,email:result.rows[0].email,notice:'Đã cấp tài khoản Staff dùng cho luồng mô phỏng. Không liên kết với hồ sơ nhân viên phân công.'});
 }catch(e){if(e.code==='23505')return fail(res,409,'Email này đã được sử dụng.');throw e;}
}));
// V6.20: staff login is provisioned by an admin, never self-registered.
app.post('/api/admin/staff/:id/access',auth,admin,handler(async(req,res)=>{
 const d=z.object({email:emailSchema,initialPassword:z.string().min(12).max(128)}).strict().parse(req.body);
 const c=await pool.connect();try{
  await c.query('BEGIN');
  const staff=await c.query('SELECT id,full_name,active,user_id FROM staff_members WHERE id=$1 FOR UPDATE',[req.params.id]);
  if(!staff.rowCount||!staff.rows[0].active){await c.query('ROLLBACK');return fail(res,404,'Không tìm thấy nhân viên đang hoạt động.');}
  if(staff.rows[0].user_id){await c.query('ROLLBACK');return fail(res,409,'Nhân viên đã có tài khoản đăng nhập.');}
  const hash=await bcrypt.hash(d.initialPassword,12);
  const user=await c.query("INSERT INTO users(email,full_name,password_hash,role) VALUES($1,$2,$3,'staff') RETURNING id,email",[d.email,staff.rows[0].full_name,hash]);
  await c.query('UPDATE staff_members SET user_id=$1 WHERE id=$2',[user.rows[0].id,staff.rows[0].id]);
  await c.query('COMMIT');res.status(201).json({ok:true,email:user.rows[0].email,message:'Đã cấp tài khoản nhân viên. Yêu cầu đổi mật khẩu khi nhận bàn giao.'});
 }catch(e){await c.query('ROLLBACK');if(e.code==='23505')return fail(res,409,'Email đã tồn tại hoặc tài khoản đã được cấp.');throw e;}finally{c.release();}
}));
app.get('/api/staff/my-work',auth,handler(async(req,res)=>{
 if(req.user.role!=='staff')return fail(res,403,'Chỉ tài khoản nhân viên.');
 const q=await pool.query(`SELECT count(*)::int AS "activeBookings" FROM booking_assignments a JOIN bookings b ON b.id=a.booking_id WHERE b.status IN ('Đã xác nhận','Đang thực hiện')`);
 res.json({fullName:'Nhân viên vận hành',branch:'Tất cả chi nhánh',active:true,activeBookings:q.rows[0].activeBookings});
}));

// Booking queue: query from operational records, no localStorage mock data.
app.get('/api/admin/queue',auth,admin,handler(async(req,res)=>{
 const d=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),status:z.enum(['all','Đang chờ xác nhận','Đã xác nhận','Đang thực hiện','Hoàn tất','Đã hủy']).default('all')}).parse(req.query);
 const args=[];const filters=[];
 if(d.date){args.push(d.date);filters.push('b.booking_date=$'+args.length);}
 if(d.status!=='all'){args.push(d.status);filters.push('b.status=$'+args.length);}
 const q=await pool.query(`SELECT b.code,b.booking_date::text AS "date",b.slot,b.status,b.service,b.branch,b.total,b.payment_status AS "paymentStatus",sm.full_name AS "assignedStaff",ns.reason AS "noShowReason",p.name AS "petName",u.full_name AS "ownerName" FROM bookings b JOIN pets p ON p.id=b.pet_id JOIN users u ON u.id=b.customer_id LEFT JOIN booking_assignments ba ON ba.booking_id=b.id LEFT JOIN staff_members sm ON sm.id=ba.staff_id LEFT JOIN booking_no_shows ns ON ns.booking_id=b.id ${filters.length?'WHERE '+filters.join(' AND '):''} ORDER BY b.booking_date ASC,b.slot ASC,b.id ASC LIMIT 200`,args);
 res.json(q.rows);
}));

app.use((err,req,res,next)=>{if(err.type==='entity.too.large')return fail(res,413,'Ảnh vượt quá dung lượng 5 MB. Hãy nén ảnh và thử lại.');if(req.path==='/api/pets/photo'&&['EACCES','EPERM','ENOSPC'].includes(err.code)){console.error('[pet-photo-storage]',err.code);return fail(res,507,'Không lưu được ảnh vào server/uploads. Kiểm tra quyền ghi và dung lượng ổ đĩa.');}if(err instanceof z.ZodError)return fail(res,400,err.issues.map(i=>i.path.join('.')+': '+i.message).join('; '));if(err.code==='23505')return fail(res,409,'Dữ liệu đã tồn tại hoặc trùng lịch. Vui lòng tải lại.');if(err.code==='23503')return fail(res,400,'Tham chiếu dữ liệu không hợp lệ.');if(err.code==='23514'&&err.constraint==='bookings_service_check'){console.error('[service-constraint]',err.message);return fail(res,503,'Database chưa cập nhật danh mục 8 gói. Sao lưu petday, đối chiếu SQL 022_v638_service_packages.sql; không chạy lại SQL 001–021.');}if(err.code==='23514'){console.error('[check-constraint]',req.path,err.constraint,err.message);return fail(res,422,'Dữ liệu chưa đáp ứng điều kiện của hệ thống: '+(err.constraint||'kiểm tra dữ liệu')+'. Vui lòng kiểm tra lại.');}if(err.code==='42703'||err.code==='42P01'){console.error('[schema-mismatch]',req.method,req.path,err.code,err.message);return fail(res,503,'Cấu trúc PostgreSQL chưa đồng bộ với source. Kiểm tra /api/health/schema và các migration 009–020 sau khi sao lưu.');}console.error(err);return fail(res,500,'Lỗi xử lý API. Kiểm tra terminal backend và đường dẫn API gặp lỗi.');});
app.listen(Number(process.env.PORT||4000),()=>{
 console.log('PetDay API running at http://localhost:'+(process.env.PORT||4000));
 if(autoRemindersEnabled){
  console.log('[reminders] Automatic in-app reminder check enabled (hourly)');
  // Start after the app binds, then repeat; no emails or banking actions are performed.
  void scheduledReminderCheck();
  setInterval(()=>void scheduledReminderCheck(),60*60*1000).unref();
 }
});

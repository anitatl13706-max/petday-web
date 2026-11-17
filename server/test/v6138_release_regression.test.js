import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bookingFinishDate,autoCloseDecision} from '../src/autoClosePolicy.mjs';
import {canCollect} from '../../src/financeLedgerRules.mjs';
const read=(file)=>readFileSync(new URL(file,import.meta.url),'utf8');
const app=read('../../src/App.tsx'), portal=read('../../src/Portal.tsx'),server=read('../src/server.js');
test('nine service names map to nine different valid local WebP assets',()=>{
 const map=app.match(/const serviceImages: Record<string,string> = \{([\s\S]*?)\};/)[1];
 const entries=[...map.matchAll(/'([^']+)': '(\/services\/[^']+\.webp)'/g)];
 assert.equal(entries.length,9);const hashes=new Set();
 for(const [,name,path] of entries){const file=new URL('../../public'+path,import.meta.url);assert.ok(existsSync(file),name);const bytes=readFileSync(file);assert.equal(bytes.toString('ascii',8,12),'WEBP');hashes.add(createHash('sha256').update(bytes).digest('hex'));}
 assert.equal(hashes.size,9);
});
test('multi-day current Daycare package uses departure date, not arrival for completion',()=>{
 const finish=bookingFinishDate({category:'Daycare',service:'Daycare cả ngày',date:'2026-11-18',lineItems:[{type:'schedule',endDate:'2026-11-22'}]});
 assert.equal(finish,'2026-11-22');assert.equal(autoCloseDecision({status:'Đang thực hiện',finishDate:finish,today:'2026-11-20'}),null);
 assert.equal(autoCloseDecision({status:'Đã xác nhận',finishDate:'2026-11-18',today:'2026-11-19'}),'no_show');
});
test('uncompleted service never appears as collectable by normal payment action',()=>assert.equal(canCollect({status:'Không hoàn thành',paymentStatus:'Chưa thanh toán'}),false));
test('cash-unpaid completion is explicit, keeps receipt guard, and uses the unified checkout dialog',()=>{assert.match(server,/cashReceived!==true&&d\.closeWithoutPayment!==true/);assert.match(server,/cashEligible&&d\.cashReceived===true/);assert.match(portal,/CareCompletionDialog/);assert.doesNotMatch(portal,/Chăm sóc xong · chưa thu đủ<\/button>/);});
test('payment hold expiry excludes reports and receipts and audits as system not No-show',()=>{assert.match(server,/async function automaticPaymentHoldExpiry\(/);assert.match(server,/NOT EXISTS\(SELECT 1 FROM booking_payment_receipts br WHERE br.booking_id=b.id\)/);assert.match(server,/QR_HOLD_EXPIRED:/);assert.match(server,/qr\.reported_at IS NULL/);});
test('missing optional timeline image relation does not block reading care milestones',()=>{assert.match(server,/to_regclass\('public.care_event_images'\)/);assert.match(server,/to_jsonb\(e\)->>'photo_url'/);assert.match(server,/\$\{imageSQL\} AS images/);});
test('incomplete notification appears once in the appointment card and action is placed with checkout',()=>{assert.equal((portal.match(/Dịch vụ đã dừng trước khi hoàn tất\. PetDay sẽ liên/g)||[]).length,1);assert.match(portal,/Hoàn tất chăm sóc\s*<\/button>\s*\{user.role === "admin"[\s\S]{0,700}>Không hoàn thành<\/button>/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const base = new URL('../src/server.js', import.meta.url);
const source=readFileSync(fileURLToPath(base),'utf8');
test('cash finish refuses to create checkout without verified cash confirmation',()=>{
 assert.match(source,/settlementBefore\.outstanding>0&&cashEligible&&d\.cashReceived!==true/);
 assert.match(source,/INSERT INTO booking_payment_receipts\(booking_id,amount,method,reference,note,recorded_by,purpose\)/);
 assert.match(source,/UPDATE bookings SET payment_status='Đã thanh toán',status='Hoàn tất'/);
});
test('deleting notifications is authenticated and scoped to logged-in owner',()=>{
 assert.match(source,/app\.delete\('\/api\/my\/notifications\/read',auth/);
 assert.match(source,/DELETE FROM account_notifications WHERE user_id=\$1 AND read_at IS NOT NULL/);
 assert.match(source,/DELETE FROM account_notifications WHERE id=\$1 AND user_id=\$2/);
});
test('listing bookings invokes automatic closeout when enabled',()=>{
 assert.match(source,/app\.get\('\/api\/bookings',auth,handler\(async\(req,res\)=>\{\s*if\(process\.env\.PETDAY_AUTO_CLOSE_ENABLED!=='false'\)await automaticDailyCloseout\(\)/);
});

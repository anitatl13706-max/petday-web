import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('automatic cancellations require clean care and taxi state',()=>{
 const route=source.slice(source.indexOf("const customerAutomaticCancellation = handler"),source.indexOf("app.patch('/api/admin/cancellation-requests"));
 assert.match(route,/service_events/);assert.doesNotMatch(route,/Taxi đã hoạt động hoặc có sự cố/);
 assert.match(route,/booking_payment_receipts/);
 assert.match(route,/VALUES\(\$1,\$2,\$3,'approved'/);
 assert.match(route,/refundTransferCompleted:false/);
 assert.doesNotMatch(route,/SET payment_status='Đã thanh toán'/);
});
test('automatic reschedules lock capacity, owner and pet without Taxi legacy veto',()=>{
 const route=source.slice(source.indexOf("app.post('/api/bookings/:code/reschedule'"),source.indexOf("app.post('/api/admin/bookings/:code/reschedule-proposal'"));
 for(const marker of ['req.user.id','pg_advisory_xact_lock','petClash','occupied+services[b.service].units','UPDATE bookings SET booking_date'])assert.ok(route.includes(marker),marker);
});

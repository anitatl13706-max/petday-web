import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const route=src.slice(src.indexOf("app.post('/api/bookings/:code/reschedule'"),src.indexOf('// PetDay may PROPOSE'));
const cancel=src.slice(src.indexOf('const customerAutomaticCancellation = handler'),src.indexOf("app.post('/api/bookings/:code/cancellation-request'"));
const sql=readFileSync(new URL('../../database/063_v6126_reschedule_slot_compat.sql',import.meta.url),'utf8');
test('reschedule is independent of historic Taxi and tracks customer-origin change',()=>{
 assert.doesNotMatch(route,/const activeTaxi|const legacyTaxi/);
 assert.match(route,/customerOrigin/);
 assert.match(route,/previousCustomerChange/);
 assert.match(route,/UPDATE bookings SET booking_date/);
});
test('cancel treats add-on total as booking, counts admin-assisted customer change',()=>{
 assert.match(cancel,/careCharge=Number\(b.total\)/);
 assert.match(cancel,/reason LIKE 'Khách yêu cầu:%'/);
 assert.doesNotMatch(cancel,/const activeLegs|const completedLegacy/);
});
test('SQL migration replaces old slot check without dropping table or deleting rows',()=>{
 assert.match(sql,/DROP CONSTRAINT IF EXISTS booking_reschedule_requests_proposed_slot_check/);
 assert.match(sql,/ADD CONSTRAINT booking_reschedule_requests_proposed_slot_check/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|TRUNCATE/i);
});

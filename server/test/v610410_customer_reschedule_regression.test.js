import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sameAppointmentTime} from '../src/rescheduleTime.mjs';
const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('Customer reschedule POST route matches frontend',()=>{
 assert.match(server,/app\.post\('\/api\/bookings\/:code\/reschedule',auth,handler/);
});
test('Customer owns appointment; safe changes are applied automatically',()=>{
 const start=server.indexOf("app.post('/api/bookings/:code/reschedule'");
 const end=server.indexOf("// PetDay may PROPOSE",start);
 const route=server.slice(start,end);
 assert.match(route,/\['customer','admin'\]\.includes\(req\.user\.role\)/);
 assert.match(route,/Number\(b\.customer_id\)!==Number\(req\.user\.id\)/);
 assert.match(route,/booking_reschedule_requests/);
 assert.match(route,/UPDATE bookings SET booking_date/);
 assert.match(route,/pg_advisory_xact_lock/);
 assert.match(route,/occupied\+services\[b\.service\]\.units/);
 assert.doesNotMatch(route,/Taxi đã xuất phát hoặc đã kết thúc/);
 assert.match(route,/status='pending' FOR UPDATE/);
 // Approved requests are audit history, not a ban on all future policy-compliant changes.
 assert.doesNotMatch(route,/status IN \('pending','approved'\)/);
});
test('Booking date and hour equality compares calendar date, not UTC instant',()=>{
 assert.equal(sameAppointmentTime('2026-12-05','08:30','2026-12-05','08:30'),true);
 assert.equal(sameAppointmentTime('2026-12-05','08:30','2026-12-05','10:00'),false);
});

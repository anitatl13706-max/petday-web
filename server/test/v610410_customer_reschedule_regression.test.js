import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sameAppointmentTime} from '../src/rescheduleTime.mjs';
const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('Customer reschedule POST route matches frontend',()=>{
 assert.match(server,/app\.post\('\/api\/bookings\/:code\/reschedule',auth,handler/);
});
test('Customer must own appointment; original time remains until approval',()=>{
 const start=server.indexOf("app.post('/api/bookings/:code/reschedule'");
 const end=server.indexOf("// PetDay may PROPOSE",start);
 const route=server.slice(start,end);
 assert.match(route,/req\.user\.role!=='customer'/);
 assert.match(route,/Number\(b\.customer_id\)!==Number\(req\.user\.id\)/);
 assert.match(route,/booking_reschedule_requests/);
 assert.doesNotMatch(route,/UPDATE bookings SET booking_date/);
 assert.match(route,/activeTaxi/);
 assert.match(route,/status IN \('pending','approved'\)/);
});
test('Booking date and hour equality compares calendar date, not UTC instant',()=>{
 assert.equal(sameAppointmentTime('2026-12-05','08:30','2026-12-05','08:30'),true);
 assert.equal(sameAppointmentTime('2026-12-05','08:30','2026-12-05','10:00'),false);
});

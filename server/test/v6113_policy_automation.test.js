import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {customerReschedulePolicy,rescheduleTargetIssue} from '../src/customerReschedulePolicy.mjs';
import {cancellationPolicy} from '../src/cancellationPolicy.mjs';
import {taxiCustomerCancellationRefund,taxiLegTransitionIssue} from '../src/taxiIncidentRules.mjs';
import {taxiRefundCreateIssue,refundableTaxiAmount} from '../src/taxiRefundRules.mjs';
const source=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const appt={date:'2026-11-20',slot:'10:00'};
const at=time=>Date.parse(`2026-11-20T${time}:00+07:00`);

test('policy boundary >3h: automatic booking within the next 7 days',()=>{
 const p=customerReschedulePolicy({...appt,now:at('06:59')});
 assert.equal(p.mode,'automatic');
 assert.equal(p.maxDate,'2026-11-27');
 assert.equal(rescheduleTargetIssue({...appt,targetDate:'2026-11-27',targetSlot:'09:00',now:at('06:59')}),null);
 assert.match(rescheduleTargetIssue({...appt,targetDate:'2026-11-28',targetSlot:'09:00',now:at('06:59')}),/phạm vi/);
});
test('policy boundary exactly 3h: same date or next date only',()=>{
 const p=customerReschedulePolicy({...appt,now:at('07:00')});
 assert.equal(p.mode,'automatic');
 assert.equal(p.maxDate,'2026-11-21');
 assert.equal(rescheduleTargetIssue({...appt,targetDate:'2026-11-21',targetSlot:'09:00',now:at('07:00')}),null);
});
test('policy boundary exactly 1h: assisted, original booking unchanged automatically',()=>{
 assert.equal(customerReschedulePolicy({...appt,now:at('09:00')}).mode,'assisted');
 assert.equal(customerReschedulePolicy({...appt,now:at('10:01')}).mode,'assisted');
 assert.match(source,/if\(timePolicy\.mode==='assisted'&&req\.user\.role!=='admin'\)/);
});
test('Pet Taxi operational incidents do not create separate refunds',()=>{
 assert.ok(taxiLegTransitionIssue({state:'confirmed',leg:'pickup'},'cancel'));
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'cancel_customer_departed'));
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'provider_fault'),null);
 assert.doesNotMatch(source,/autoApproveTaxiRefunds|INSERT INTO taxi_refund_requests|due=Number\(row\.fee\)/);
});
test('refund ledger uses actual collected money, not booking total or a button click',()=>{
 assert.equal(refundableTaxiAmount({refundDue:70000,refundCandidate:20000}),20000);
 assert.match(taxiRefundCreateIssue({state:'cancelled',refundDue:70000,fee:70000,collected:0}),/Chưa ghi nhận tiền/);
 assert.match(taxiRefundCreateIssue({state:'cancelled',refundDue:70000,fee:70000,collected:80000,serviceReserved:40000}),/vượt khoản đã thu/);
});
test('service refund policy legacy levels remain explicit and separate from Taxi',()=>{
 assert.equal(cancellationPolicy({date:appt.date,slot:appt.slot,requestedAt:new Date('2026-11-18T00:00:00+07:00'),total:100000}).refundAmount,100000);
 assert.equal(cancellationPolicy({date:appt.date,slot:appt.slot,requestedAt:new Date('2026-11-19T12:00:00+07:00'),total:100000}).refundAmount,80000);
 assert.equal(cancellationPolicy({date:appt.date,slot:appt.slot,requestedAt:new Date('2026-11-20T09:00:00+07:00'),total:100000}).refundAmount,0);
});
test('no unnecessary approval: a previous approved change is audit history, not a permanent lock',()=>{
 const route=source.slice(source.indexOf("app.post('/api/bookings/:code/reschedule'"),source.indexOf("// PetDay may PROPOSE"));
 assert.match(route,/status='pending' FOR UPDATE/);
 assert.doesNotMatch(route,/status IN \('pending','approved'\) FOR UPDATE/);
 assert.match(route,/UPDATE booking_reschedule_requests SET status='rejected'/);
 assert.match(route,/INSERT INTO booking_reschedule_requests/);
 assert.match(route,/UPDATE bookings SET booking_date/);
});

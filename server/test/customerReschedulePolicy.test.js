import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {customerReschedulePolicy,rescheduleTargetIssue} from '../src/customerReschedulePolicy.mjs';
const appointment={date:'2026-11-16',slot:'15:00'};
const ms=(time)=>Date.parse('2026-11-16T'+time+':00+07:00');
test('more than 3 hours = self-service within next seven days',()=>{
 const p=customerReschedulePolicy({...appointment,now:ms('11:59')});assert.equal(p.mode,'automatic');assert.equal(p.maxDate,'2026-11-23');
});
test('exactly 3h and greater than 1h = self-service through following day',()=>{
 const p=customerReschedulePolicy({...appointment,now:ms('12:00')});assert.equal(p.mode,'automatic');assert.equal(p.maxDate,'2026-11-17');
 assert.match(rescheduleTargetIssue({...appointment,targetDate:'2026-11-18',targetSlot:'10:00',now:ms('12:00')}),/phạm vi/);
});
test('exactly one hour and late = staff-assisted only',()=>{
 assert.equal(customerReschedulePolicy({...appointment,now:ms('14:00')}).mode,'assisted');
 assert.equal(customerReschedulePolicy({...appointment,now:ms('15:01')}).mode,'assisted');
});
test('cannot move to elapsed times',()=>{
 assert.match(rescheduleTargetIssue({...appointment,targetDate:'2026-11-16',targetSlot:'10:00',now:ms('11:00')}),/tương lai/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {daycareCharge,daycareWindowIssue,applyDaycareAndCompanion,bookingInterval,hasOverlap} from '../src/daycarePolicy.mjs';
import {calculate} from '../src/rules.js';
const pet={species:'Chó',weight:5,age:2};
test('daycare four hours billed at base package',()=>{
 assert.deepEqual(daycareCharge('Daycare nửa ngày','08:00','12:00'),{minutes:240,amount:160000});
});
test('daycare two hours billed proportionally',()=>{
 assert.deepEqual(daycareCharge('Daycare nửa ngày','08:00','10:00'),{minutes:120,amount:80000});
});
test('daycare eight hours billed at full day price',()=>{
 assert.deepEqual(daycareCharge('Daycare cả ngày','08:00','16:00'),{minutes:480,amount:320000});
});
test('daycare does not allow outside operating hours',()=>{
 assert.ok(daycareWindowIssue('Daycare nửa ngày','07:30','11:30'));
 assert.ok(daycareWindowIssue('Daycare cả ngày','17:00','20:30'));
});
test('daycare companion must be Grooming or Spa, maximum one',()=>{
 const q=calculate('Daycare nửa ngày',pet);
 applyDaycareAndCompanion(q,{service:'Daycare nửa ngày',slot:'08:00',daycarePickupTime:'12:00',companionService:'Grooming cơ bản',pet});
 assert.equal(q.total,300000);
 assert.equal(q.lines.filter(x=>x.type==='companion_service').length,1);
 assert.throws(()=>applyDaycareAndCompanion(calculate('Daycare nửa ngày',pet),{service:'Daycare nửa ngày',slot:'08:00',daycarePickupTime:'09:00',companionService:'Spa thư giãn',pet}));
});
test('daycare chosen hours determine capacity overlap',()=>{
 const a=bookingInterval('Daycare nửa ngày','08:00',[{type:'schedule',endTime:'10:00'}]);
 assert.equal(hasOverlap(a,bookingInterval('Grooming cơ bản','10:00')),false);
 assert.equal(hasOverlap(a,bookingInterval('Grooming cơ bản','08:30')),true);
});

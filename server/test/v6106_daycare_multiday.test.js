import test from 'node:test';
import assert from 'node:assert/strict';
import {daycareCharge,daycareWindowIssue,daycarePeriods,bookingPeriods} from '../src/daycarePolicy.mjs';
import {buildDailySlotPreview,validSlot} from '../src/rules.js';
test('exactly eight 90-minute windows from 08:00 to 20:00',()=>{
 const s=buildDailySlotPreview({service:'Grooming vệ sinh nhanh',branch:'PetDay Thảo Điền'}).map(x=>x.slot);
 assert.deepEqual(s,['08:00','09:30','11:00','12:30','14:00','15:30','17:00','18:30']);
 assert.equal(validSlot('Grooming tạo kiểu','18:30'),false); // would end after closing
});
test('Daycare hourly billing for one 12-hour service day',()=>{
 assert.deepEqual(daycareCharge('Daycare cả ngày','08:00','20:00','2026-11-20','2026-11-20'),{minutes:720,amount:480000});
});
test('Daycare across two dates charges only attended operating hours',()=>{
 const b=daycareCharge('Daycare cả ngày','14:00','11:00','2026-11-20','2026-11-21');
 assert.deepEqual(b,{minutes:540,amount:360000});
 assert.deepEqual(daycarePeriods('2026-11-20','2026-11-21','14:00','11:00').map(x=>x.date),['2026-11-20','2026-11-21']);
});
test('No overnight time and date errors',()=>{
 assert.ok(daycareWindowIssue('Daycare cả ngày','19:00','08:00','2026-11-20','2026-11-21'));
 assert.ok(daycareWindowIssue('Daycare cả ngày','14:00','11:00','2026-11-21','2026-11-20'));
 assert.ok(daycareWindowIssue('Daycare cả ngày','14:00','11:00','2026-11-20','2026-11-28'));
});
test('Daycare booking occupies both dates for availability checks',()=>{
 const p=bookingPeriods('Daycare cả ngày','2026-11-20','14:00',[{type:'schedule',endDate:'2026-11-21',endTime:'11:00'}]);
 assert.equal(p.length,2);assert.deepEqual(p[0],{date:'2026-11-20',start:840,end:1200});
 assert.deepEqual(p[1],{date:'2026-11-21',start:480,end:660});
});

test('Daycare accepts valid minute-level arrival and departure, charges actual minutes',()=>{
 assert.equal(validSlot('Daycare cả ngày','09:00'),true);
 assert.equal(validSlot('Daycare cả ngày','09:17'),true);
 assert.equal(daycareWindowIssue('Daycare cả ngày','09:00','13:34','2026-11-20','2026-11-20'),null);
 assert.deepEqual(daycareCharge('Daycare cả ngày','09:00','13:34','2026-11-20','2026-11-20'),{minutes:274,amount:182667});
 assert.ok(daycareWindowIssue('Daycare cả ngày','09:00','08:59','2026-11-20','2026-11-20'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {vietnamToday,bookingFinishDate,autoCloseDecision} from '../src/autoClosePolicy.mjs';
test('Vietnam-local day ignores server UTC day',()=>{
 assert.equal(vietnamToday(new Date('2026-11-15T18:00:00Z')),'2026-11-16');
});
test('confirmed older date is no-show only without arrival evidence',()=>{
 const args={status:'Đã xác nhận',finishDate:'2026-11-15',today:'2026-11-16'};
 assert.equal(autoCloseDecision(args),'no_show');
 assert.equal(autoCloseDecision({...args,hasArrival:true}),'completed');
 assert.equal(autoCloseDecision({...args,hasTaxiArrival:true}),'no_show');
 assert.equal(autoCloseDecision({...args,today:'2026-11-15'}),null);
});
test('in-progress older day completes without touching payment',()=>{
 assert.equal(autoCloseDecision({status:'Đang thực hiện',finishDate:'2026-11-15',today:'2026-11-16'}),'completed');
 assert.equal(autoCloseDecision({status:'Đã hủy',finishDate:'2026-11-15',today:'2026-11-16'}),null);
});
test('Daycare end date determines actual completion cutoff',()=>{
 const finish=bookingFinishDate({category:'Daycare',date:'2026-11-15',lineItems:[{type:'schedule',endDate:'2026-11-18'}]});
 assert.equal(finish,'2026-11-18');
 assert.equal(bookingFinishDate({service:'Daycare nửa ngày',category:'Daycare',date:'2026-11-15',lineItems:[]}), '2026-11-15');
 assert.equal(bookingFinishDate({service:'Daycare cả ngày',category:'Daycare',date:'2026-11-15',lineItems:[]}), '2026-11-15');
 assert.equal(bookingFinishDate({service:'Daycare lưu trú',category:'Daycare',date:'2026-11-15',lineItems:[]}),null);
 assert.equal(autoCloseDecision({status:'Đang thực hiện',finishDate:finish,today:'2026-11-16'}),null);
});

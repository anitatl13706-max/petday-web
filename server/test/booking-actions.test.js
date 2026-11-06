import test from 'node:test';
import assert from 'node:assert/strict';
import {countBookingActions} from '../../src/bookingActionRules.mjs';
const today='2026-11-03';
const create=(status,overrides={})=>({status,date:today,paymentStatus:'Chưa thanh toán',rating:null,...overrides});
test('empty customer dashboard has zero actionable items',()=>{
 assert.deepEqual(countBookingActions([],today),{awaiting:0,intake:0,payments:0,reviews:0});
});
test('confirmed upcoming booking missing care details is flagged',()=>{
 const counts=countBookingActions([create('Đã xác nhận')],today);
 assert.equal(counts.intake,1);assert.equal(counts.payments,1);
});
test('submitted intake is not counted as missing',()=>{
 assert.equal(countBookingActions([create('Đã xác nhận',{intakeUpdatedAt:'2026-11-02T10:00:00Z'})],today).intake,0);
});
test('cancelled booking is not a payment reminder',()=>{
 assert.equal(countBookingActions([create('Đã hủy')],today).payments,0);
});
test('completed but unpaid still needs payment reconciliation',()=>{
 const a=countBookingActions([create('Hoàn tất')],today);assert.equal(a.payments,1);assert.equal(a.reviews,1);
});
test('paid reviewed service does not request action',()=>{
 const a=countBookingActions([create('Hoàn tất',{paymentStatus:'Đã thanh toán',rating:5})],today);
 assert.deepEqual(a,{awaiting:0,intake:0,payments:0,reviews:0});
});
test('past confirmed appointment cannot request new arrival intake',()=>{
 assert.equal(countBookingActions([create('Đã xác nhận',{date:'2026-10-31'})],today).intake,0);
});

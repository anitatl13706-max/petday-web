import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {taxiQuote} from '../src/taxiRules.js';
import {initialTaxiLeg} from '../src/taxiLegBootstrap.mjs';
import {taxiLegTransitionIssue} from '../src/taxiIncidentRules.mjs';
import {bookingFeeBreakdown} from '../src/bookingFeeBreakdown.mjs';
import {settle} from '../src/settlementMath.mjs';
import {customerCancellationV120} from '../src/customerCancellationV120.mjs';
const source=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../../src/TaxiLegPanel.tsx',import.meta.url),'utf8');
const invoice=readFileSync(new URL('../../src/BookingFinancialSnapshot.tsx',import.meta.url),'utf8');
const picker=readFileSync(new URL('../../src/CareEventImages.tsx',import.meta.url),'utf8');
const taxi={enabled:true,zone:'nearby',address:'123 Đường PetDay, Quận 2',phone:'0901234567'};
test('No Taxi: unchanged care total and no independent fee',()=>{
 assert.deepEqual(bookingFeeBreakdown({total:140000,lineItems:[{amount:140000}]}),{careFee:140000,taxiFee:0,retailFee:0});
});
test('Pickup and return each charge one booked fee; round trip charges both',()=>{
 for(const [direction,fee] of [['pickup',70000],['return',70000],['round_trip',140000]]){
  const quote=taxiQuote({...taxi,direction});assert.equal(quote.fee,fee);
  const total=140000+fee;
  assert.deepEqual(bookingFeeBreakdown({total,lineItems:[{amount:140000},quote.line]}),{careFee:140000,taxiFee:fee,retailFee:0});
  assert.deepEqual(settle({total,collected:total}),{charge:total,outstanding:0,refundCandidate:0});
 }
});
test('Discounted care and retail remain separate; stored fee is the fallback, not a new quote',()=>{
 assert.deepEqual(bookingFeeBreakdown({total:240000,lineItems:[{amount:150000},{type:'retail',amount:40000},{type:'taxi',amount:70000},{amount:-20000}]}),{careFee:130000,taxiFee:70000,retailFee:40000});
 assert.deepEqual(bookingFeeBreakdown({total:210000,taxiFee:'70000'}),{careFee:140000,taxiFee:70000,retailFee:0});
});
test('Cash deposit and unpaid cash balance include Taxi at full price',()=>{
 assert.equal(settle({total:210000,collected:28000}).outstanding,182000);
 assert.equal(settle({total:210000,collected:0}).outstanding,210000);
});
test('A whole-booking closure never creates a new transport waiver',()=>{
 for(const direction of ['pickup','return','round_trip']){
  for(const leg of direction==='round_trip'?['pickup','return']:[direction]){
   const v=initialTaxiLeg({direction,status:'confirmed',booking_status:'Đã hủy',fee:direction==='round_trip'?140000:70000},leg);
   assert.equal(v.state,'cancelled');assert.equal(v.refundDue,0);
  }
 }
});
test('Individual cancellation is rejected while operational fault reporting remains',()=>{
 for(const state of ['requested','confirmed','en_route','arrived','contacting','under_review','completed']){
  assert.ok(taxiLegTransitionIssue({state,leg:'pickup'},'cancel'));
  assert.ok(taxiLegTransitionIssue({state,leg:'pickup'},'cancel_customer_departed'));
 }
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'provider_fault'),null);
 const route=source.slice(source.indexOf("app.post('/api/bookings/:code/taxi/legs/:leg/customer'"),source.indexOf("app.post('/api/admin/bookings/:code/taxi/legs/:leg/event'"));
 assert.match(route,/return fail\(res,409/);
 assert.doesNotMatch(source,/INSERT INTO taxi_refund_requests|autoApproveTaxiRefunds/);
 const op=source.slice(source.indexOf("app.post('/api/admin/bookings/:code/taxi/legs/:leg/event'"),source.indexOf("app.patch('/api/admin/bookings/:code/taxi'"));
 assert.doesNotMatch(op,/refund_due\s*=|INSERT INTO (?:refund_requests|booking_payment_receipts)/);
 assert.match(op,/settlement\.outstanding===0/);
});
test('Full booking cancellation keeps the 80% rule on the entire booking; no new Taxi refund',()=>{
 const full=customerCancellationV120({date:'2026-12-05',slot:'10:00',requestedAt:'2026-12-04T09:00:00+07:00',careCharge:210000,carePaid:210000,fullyPaid:true});
 assert.equal(full.refundAmount,168000);
 const provider=customerCancellationV120({date:'2026-12-05',slot:'10:00',requestedAt:'2026-12-04T09:00:00+07:00',careCharge:210000,carePaid:210000,fullyPaid:true,providerFault:true});
 assert.equal(provider.refundAmount,210000);
});
test('An old actual Taxi refund remains visible and is not charged again',()=>{
 assert.deepEqual(settle({total:210000,collected:210000,taxiWaived:70000,refundCompleted:70000}),{charge:140000,outstanding:0,refundCandidate:0});
 assert.match(invoice,/Lịch sử quyết toán/);assert.match(invoice,/Giảm trừ Taxi đã ghi nhận từ phiên bản cũ/);
 assert.match(source,/FROM taxi_refund_requests WHERE booking_id=\$1 AND status='completed'/);
});
test('UI has only operational transport controls and platform-neutral photo picker',()=>{
 assert.doesNotMatch(panel,/execute\(leg,'(?:cancel|self_arrival|ask_cancel|cancel_return|cancel_pickup)'/);
 assert.doesNotMatch(panel,/hoàn 50%|miễn 100%/);
 assert.match(invoice,/Phí Pet Taxi/);assert.match(invoice,/Tổng thanh toán/);
 assert.match(picker,/Thêm ảnh/);assert.doesNotMatch(picker,/Thêm ảnh từ máy tính/);
 assert.match(picker,/type="file"/);
});

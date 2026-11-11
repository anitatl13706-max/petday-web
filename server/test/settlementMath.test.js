import test from 'node:test';
import assert from 'node:assert/strict';
import {settle} from '../src/settlementMath.mjs';
test('cash unpaid: client cancels taxi after departure and owes half fee',()=>{
 const s=settle({total:70000,collected:0,taxiWaived:35000});
 assert.deepEqual(s,{charge:35000,outstanding:35000,refundCandidate:0});
});
test('bank transfer collected in full: half taxi fare refundable',()=>{
 const s=settle({total:70000,collected:70000,taxiWaived:35000});
 assert.equal(s.outstanding,0);assert.equal(s.refundCandidate,35000);
});
test('collected only after cancellation: no phantom refund',()=>{
 const s=settle({total:70000,collected:35000,taxiWaived:35000});
 assert.equal(s.outstanding,0);assert.equal(s.refundCandidate,0);
});
test('partial cash receipt yields only remaining due, not a refund',()=>{
 const s=settle({total:270000,collected:100000,taxiWaived:35000});
 assert.equal(s.outstanding,135000);assert.equal(s.refundCandidate,0);
});
test('booking-wide refund reserves cannot be paid twice',()=>{
 const s=settle({total:340000,collected:340000,taxiWaived:140000,serviceReserved:160000,refundPending:160000});
 assert.equal(s.refundCandidate,140000);assert.equal(s.outstanding,0);
});
test('completed refunds reduce remaining refundable amount',()=>{
 const s=settle({total:70000,collected:70000,taxiWaived:35000,refundCompleted:35000});
 assert.equal(s.refundCandidate,0);assert.equal(s.outstanding,0);
});
test('rejects invalid amounts and excess refunds',()=>{
 assert.throws(()=>settle({total:70000,collected:-1}));
 assert.throws(()=>settle({total:70000,collected:10000,refundPending:20000}));
});

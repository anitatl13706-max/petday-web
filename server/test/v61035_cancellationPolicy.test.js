import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancellationPolicy } from '../src/cancellationPolicy.mjs';
const apt='2026-12-05';
const sample=(requestedAt,total=250001)=>cancellationPolicy({date:apt,slot:'08:30',requestedAt,total});
test('early cancellation over 24 hours earns 100%',()=>{
 assert.deepEqual({window:sample('2026-12-04T08:29:59+07:00').window,amount:sample('2026-12-04T08:29:59+07:00').refundAmount},{window:'early',amount:250001});
});
test('at exactly 24 hours, 80% refund, integer rounded',()=>{
 const r=sample('2026-12-04T08:30:00+07:00');assert.equal(r.window,'mid');assert.equal(r.refundAmount,200001);
});
test('between 3 and 24 hours, 80%',()=>assert.equal(sample('2026-12-05T02:30:00+07:00').percentage,80));
test('exactly 3 hours is late with zero refund default',()=>{
 const r=sample('2026-12-05T05:30:00+07:00');assert.equal(r.window,'late');assert.equal(r.refundAmount,0);
});
test('one minute before start allows manual review, 0 by default',()=>assert.equal(sample('2026-12-05T08:29:00+07:00').window,'late'));
test('on/after appointment start rejects ordinary cancellation',()=>{
 assert.equal(sample('2026-12-05T08:30:00+07:00').window,'started');
 assert.equal(sample('2026-12-05T08:31:00+07:00').window,'started');
});
test('Vietnam local time must not shift calendar day',()=>{
 assert.equal(sample('2026-12-04T09:30:00+07:00').window,'mid');
});
test('invalid amount and appointment inputs do not guess refund',()=>{
 assert.equal(sample('garbage').window,'invalid');
 assert.equal(sample('2026-12-04T09:30:00+07:00',Number.NaN).window,'invalid');
});

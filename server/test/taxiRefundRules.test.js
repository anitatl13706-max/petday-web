import test from 'node:test';
import assert from 'node:assert/strict';
import {taxiRefundCreateIssue,taxiRefundTransitionIssue,refundableTaxiAmount} from '../src/taxiRefundRules.mjs';
const sample={state:'customer_self',refundDue:70000,fee:70000,collected:340000,serviceReserved:160000,taxiReserved:0};
test('refund per leg is eligible after paid customer self-arrival',()=>assert.equal(taxiRefundCreateIssue(sample),null));
test('no paid receipt means no cash refund',()=>assert.match(taxiRefundCreateIssue({...sample,collected:0}),/Chưa ghi nhận/));
test('active or completed Taxi does not qualify',()=>{for(const state of ['requested','confirmed','en_route','completed','no_show','under_review'])assert.ok(taxiRefundCreateIssue({...sample,state}))});
test('leg refund can never exceed that leg fee',()=>assert.ok(taxiRefundCreateIssue({...sample,refundDue:80000})));
test('service plus Taxi refunds cannot exceed total paid',()=>assert.match(taxiRefundCreateIssue({...sample,serviceReserved:300000}),/vượt/));
test('two 70k legs plus 160k service are within 340k receipt',()=>assert.equal(taxiRefundCreateIssue({...sample,taxiReserved:70000}),null));
test('must approve before completed',()=>assert.ok(taxiRefundTransitionIssue('pending','complete')));
test('approved can complete but cannot approve again',()=>{assert.equal(taxiRefundTransitionIssue('approved','complete'),null);assert.ok(taxiRefundTransitionIssue('approved','approve'))});
test('completed cannot be paid twice',()=>assert.ok(taxiRefundTransitionIssue('completed','complete')));

test('partially paid booking may refund actual overpayment without requiring full-paid flag',()=>{
 assert.equal(refundableTaxiAmount({refundDue:35000,refundCandidate:15000}),15000);
 assert.equal(taxiRefundCreateIssue({...sample,refundDue:15000,collected:250000,serviceReserved:0,taxiReserved:0}),null);
});
test('cannot refund without a confirmed receipt',()=>{
 assert.equal(refundableTaxiAmount({refundDue:35000,refundCandidate:0}),0);
 assert.ok(taxiRefundCreateIssue({...sample,collected:0}));
});

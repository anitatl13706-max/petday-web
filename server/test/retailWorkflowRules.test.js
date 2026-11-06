import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {retailNextStatuses,retailTransitionIssue,retailTransferNoticeIssue} from '../src/retailWorkflowRules.js';
test('Pickup order skips shipping and proceeds from ready to completed',()=>{
 assert.deepEqual(retailNextStatuses('ready','pickup'),['completed','cancelled']);
 assert.ok(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'pickup'}));
});
test('Delivery requires shipping and an expected delivery date',()=>{
 assert.deepEqual(retailNextStatuses('ready','delivery'),['shipping','cancelled']);
 assert.ok(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery'}));
 assert.equal(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery',hasDeliveryEta:true}),null);
});
test('Bank transfer is reconciled separately from delivery',()=>{
 assert.ok(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery',paymentMethod:'bank_transfer',hasDeliveryEta:true}));
 assert.equal(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery',paymentMethod:'bank_transfer',hasDeliveryEta:true,paid:true}),null);
});
test('No completed order before payment confirmation',()=>{
 assert.ok(retailTransitionIssue({status:'ready',nextStatus:'completed',fulfillment:'pickup'}));
 assert.equal(retailTransitionIssue({status:'ready',nextStatus:'completed',fulfillment:'pickup',paid:true}),null);
});
test('Already paid order cannot be directly cancelled',()=>{
 assert.ok(retailTransitionIssue({status:'confirmed',nextStatus:'cancelled',paid:true}));
});

test('Shop transfer notice cannot mark cash, paid or cancelled orders as paid',()=>{
 assert.equal(retailTransferNoticeIssue({paymentMethod:'bank_transfer',paymentStatus:'unpaid',status:'confirmed'}),null);
 assert.ok(retailTransferNoticeIssue({paymentMethod:'cash',paymentStatus:'unpaid',status:'confirmed'}));
 assert.ok(retailTransferNoticeIssue({paymentMethod:'bank_transfer',paymentStatus:'paid',status:'confirmed'}));
 assert.ok(retailTransferNoticeIssue({paymentMethod:'bank_transfer',paymentStatus:'unpaid',status:'cancelled'}));
});

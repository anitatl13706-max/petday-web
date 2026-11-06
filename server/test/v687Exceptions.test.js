import test from 'node:test';
import assert from 'node:assert/strict';
import {retailNextStatuses,retailTransitionIssue} from '../src/retailWorkflowRules.js';

test('failed delivery cannot be directly completed or cancelled through ordinary update',()=>{
 assert.deepEqual(retailNextStatuses('delivery_failed','delivery'),[]);
 assert.match(retailTransitionIssue({status:'delivery_failed',nextStatus:'completed',fulfillment:'delivery',paid:true}),/Trạng thái/);
 assert.match(retailTransitionIssue({status:'return_pending',nextStatus:'cancelled',fulfillment:'delivery',paid:false}),/Trạng thái/);
});
test('normal shipping still requires paid transfer and a delivery date',()=>{
 assert.match(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery',paymentMethod:'bank_transfer',paid:false,hasDeliveryEta:true}),/đối soát/);
 assert.equal(retailTransitionIssue({status:'ready',nextStatus:'shipping',fulfillment:'delivery',paymentMethod:'bank_transfer',paid:true,hasDeliveryEta:true}),null);
});

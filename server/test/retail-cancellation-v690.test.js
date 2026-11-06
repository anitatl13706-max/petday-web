import test from 'node:test';
import assert from 'node:assert/strict';
import {customerRetailCancellationIssue,adminRetailCancellationIssue} from '../src/retailCancellationRules.mjs';
test('customer cancellation only before shipping/receiving',()=>{
 for(const s of ['pending','confirmed','ready']) assert.equal(customerRetailCancellationIssue(s),null);
 for(const s of ['shipping','completed','cancelled','delivery_failed','returned']) assert.ok(customerRetailCancellationIssue(s));
 assert.ok(customerRetailCancellationIssue('pending',true));
});
test('admin cannot cancel an order with unresolved transfer notice',()=>{
 assert.match(adminRetailCancellationIssue({requestStatus:'pending',orderStatus:'ready',paymentMethod:'bank_transfer',paymentStatus:'unpaid',hasTransferNotice:true}),/đối soát/);
 assert.equal(adminRetailCancellationIssue({requestStatus:'pending',orderStatus:'ready',paymentMethod:'bank_transfer',paymentStatus:'paid',hasTransferNotice:true}),null);
 assert.ok(adminRetailCancellationIssue({requestStatus:'approved',orderStatus:'ready'}));
});

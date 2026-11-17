import test from 'node:test';
import assert from 'node:assert/strict';
import {taxiLegTransitionIssue,taxiCustomerCancellationRefund} from '../src/taxiIncidentRules.mjs';
import {taxiRefundCreateIssue} from '../src/taxiRefundRules.mjs';
test('legacy 50% math remains auditable, but live Taxi cannot cancel',()=>{
 assert.equal(taxiCustomerCancellationRefund(70000),35000);
 assert.equal(taxiCustomerCancellationRefund(70001),35000);
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'cancel_customer_departed'));
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'return'},'cancel_customer_departed'));
});
test('cannot retroactively cancel a trip before departure or after handoff',()=>{
 for(const state of ['requested','confirmed','completed','cancelled','customer_self','no_show','provider_fault']){
  assert.ok(taxiLegTransitionIssue({state,leg:'pickup'},'cancel_customer_departed'));
 }
});
test('50% taxi leg refund can enter existing paid refund ledger',()=>{
 assert.equal(taxiRefundCreateIssue({state:'cancelled',refundDue:35000,fee:70000,collected:340000,serviceReserved:160000,taxiReserved:0}),null);
 assert.ok(taxiRefundCreateIssue({state:'cancelled',refundDue:35000,fee:70000,collected:0}));
});
test('invalid fee is not silently accepted',()=>{
 assert.throws(()=>taxiCustomerCancellationRefund(-1));
 assert.throws(()=>taxiCustomerCancellationRefund(0.5));
});

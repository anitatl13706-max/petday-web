import test from 'node:test';
import assert from 'node:assert/strict';
import {initialTaxiLeg} from '../src/taxiLegBootstrap.mjs';
import {taxiLegTransitionIssue,taxiCustomerCancellationRefund} from '../src/taxiIncidentRules.mjs';
import {refundableTaxiAmount} from '../src/taxiRefundRules.mjs';

test('V6.121: Taxi auto confirmed if valid service booking',()=>{
 const x=initialTaxiLeg({direction:'round_trip',fee:140000,status:'requested',booking_status:'Đã xác nhận'},'return');
 assert.equal(x.state,'confirmed');assert.equal(x.fee,70000);
});
test('V6.121: pending deposit cannot start taxi',()=>{
 const x=initialTaxiLeg({direction:'pickup',fee:70000,status:'requested',booking_status:'Đang chờ xác nhận'},'pickup');
 assert.equal(x.state,'requested');
});
test('V6.121: Admin may depart directly from booked taxi, but not twice',()=>{
 assert.equal(taxiLegTransitionIssue({state:'requested',leg:'pickup'},'depart'),null);
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'depart')!==null,true);
});
test('V6.121: taxi 50% round-down and never refund more than actual collection',()=>{
 assert.equal(taxiCustomerCancellationRefund(70001),35000);
 assert.equal(refundableTaxiAmount({refundDue:70000,refundCandidate:0}),0);
 assert.equal(refundableTaxiAmount({refundDue:70000,refundCandidate:25000}),25000);
});
test('V6.121: taxi provider fault supersedes in-flight journey; completed leg cannot be cancelled',()=>{
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'return'},'provider_fault'),null);
 assert.notEqual(taxiLegTransitionIssue({state:'completed',leg:'return'},'cancel'),null);
});

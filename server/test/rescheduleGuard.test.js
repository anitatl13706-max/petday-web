import test from 'node:test';
import assert from 'node:assert/strict';
import {rescheduleDecisionIssue,taxiLegPreventsAutomaticReschedule} from '../src/rescheduleGuard.mjs';
test('Customer proposal requires Admin decision, not self-approval',()=>{
 assert.equal(rescheduleDecisionIssue({role:'admin',userId:1,customerId:7,requestedBy:7}),null);
 assert.ok(rescheduleDecisionIssue({role:'customer',userId:7,customerId:7,requestedBy:7}));
});
test('Admin proposal requires its customer approval, not Admin self-approval',()=>{
 assert.equal(rescheduleDecisionIssue({role:'customer',userId:7,customerId:7,requestedBy:1}),null);
 assert.ok(rescheduleDecisionIssue({role:'admin',userId:1,customerId:7,requestedBy:1}));
 assert.ok(rescheduleDecisionIssue({role:'customer',userId:8,customerId:7,requestedBy:1}));
});
test('Only not-started Taxi legs may be automatically rescheduled',()=>{
 for(const s of ['requested','confirmed'])assert.equal(taxiLegPreventsAutomaticReschedule(s),false);
 for(const s of ['en_route','completed','cancelled','customer_self','no_show','under_review','provider_fault'])assert.equal(taxiLegPreventsAutomaticReschedule(s),true);
});

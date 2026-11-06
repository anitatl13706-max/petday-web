import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serviceNotProvided,retailNotReceived,fullRefundDecisionIssue} from '../src/fullRefundPolicy.mjs';
test('canceled unserved appointment requires full refund',()=>{
 assert.equal(serviceNotProvided('Đã hủy'),true);
 assert.equal(fullRefundDecisionIssue({mandatory:true,decision:'approve',amount:220000,total:220000}),null);
 assert.match(fullRefundDecisionIssue({mandatory:true,decision:'approve',amount:120000,total:220000}),/100%/);
 assert.match(fullRefundDecisionIssue({mandatory:true,decision:'reject',total:220000}),/100%/);
});
test('paid but not approved retail order can be cancelled and refunded when unreceived',()=>{
 assert.equal(retailNotReceived('cancelled'),true);
 assert.equal(retailNotReceived('returned'),true);
 assert.equal(retailNotReceived('completed'),false);
 assert.equal(fullRefundDecisionIssue({mandatory:true,decision:'approve',amount:191000,total:191000}),null);
});
test('refund completion remains a separate action from approval',()=>{
 assert.equal(fullRefundDecisionIssue({mandatory:true,decision:'complete',total:191000}),null);
});
test('already delivered or completed work follows separate dispute policy',()=>{
 assert.equal(serviceNotProvided('Hoàn tất'),false);
 assert.equal(retailNotReceived('completed'),false);
 assert.equal(fullRefundDecisionIssue({mandatory:false,decision:'reject',total:191000}),null);
});

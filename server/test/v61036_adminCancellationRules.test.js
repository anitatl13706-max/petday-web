import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminCancellationTerms } from '../src/adminCancellationRules.mjs';
const base={date:'2026-12-05',slot:'08:30',total:300000,paid:true};
test('admin acting on customer request 12 hours before: 80 percent',()=>{
 const r=adminCancellationTerms({...base,origin:'customer_assisted',at:'2026-12-04T20:30:00+07:00'});
 assert.equal(r.refundAmount,240000);
});
test('provider unable to serve: full recorded amount despite short notice',()=>{
 const r=adminCancellationTerms({...base,origin:'provider_unavailable',at:'2026-12-05T07:30:00+07:00'});
 assert.equal(r.refundAmount,300000);
});
test('admin acting on customer request an hour before: zero by default',()=>{
 const r=adminCancellationTerms({...base,origin:'customer_assisted',at:'2026-12-05T07:30:00+07:00'});
 assert.equal(r.refundAmount,0);
});
test('late customer-assisted cancellation can grant justified amount but not more than paid',()=>{
 assert.equal(adminCancellationTerms({...base,origin:'customer_assisted',at:'2026-12-05T07:30:00+07:00',exceptionRefundAmount:120000}).refundAmount,120000);
 assert.ok(adminCancellationTerms({...base,origin:'customer_assisted',at:'2026-12-05T07:30:00+07:00',exceptionRefundAmount:400000}).issue);
});
test('customer-assisted cancellation after start denied',()=>{
 assert.ok(adminCancellationTerms({...base,origin:'customer_assisted',at:'2026-12-05T08:30:00+07:00'}).issue);
});
test('no recorded payment means no refund regardless of origin',()=>{
 assert.equal(adminCancellationTerms({...base,paid:false,origin:'provider_unavailable',at:'2026-12-05T07:30:00+07:00'}).refundAmount,0);
});
test('cannot disguise full refund as provider cancellation exception',()=>{
 assert.ok(adminCancellationTerms({...base,origin:'provider_unavailable',at:'2026-12-05T07:30:00+07:00',exceptionRefundAmount:50000}).issue);
});

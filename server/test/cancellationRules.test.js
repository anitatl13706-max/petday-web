import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cancellationRequestIssue,cancellationDecisionIssue} from '../src/cancellationRules.js';
const sample={role:'customer',status:'Đã xác nhận',bookingDate:'2026-11-10',today:'2026-11-03',alreadyPending:false};
test('valid confirmed future booking can request cancellation',()=>assert.equal(cancellationRequestIssue(sample),null));
test('customer cannot request for another role',()=>assert.match(cancellationRequestIssue({...sample,role:'staff'}),/khách/));
test('no cancellation request on appointment day',()=>assert.ok(cancellationRequestIssue({...sample,bookingDate:'2026-11-03'})));
test('no request when appointment started',()=>assert.ok(cancellationRequestIssue({...sample,status:'Đang thực hiện'})));
test('no duplicate pending request',()=>assert.ok(cancellationRequestIssue({...sample,alreadyPending:true})));
test('admin can resolve a pending unstarted confirmed booking',()=>assert.equal(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Đã xác nhận',hasCareEvents:false}),null));
test('cannot resolve request twice',()=>assert.ok(cancellationDecisionIssue({requestStatus:'approved',bookingStatus:'Đã xác nhận',hasCareEvents:false})));
test('cannot approve cancellation after care started',()=>assert.ok(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Đã xác nhận',hasCareEvents:true})));

test('admin may approve a previously confirmed booking returned to waiting before care',()=>assert.equal(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Đang chờ xác nhận',hasCareEvents:false}),null));
test('admin sees actual current booking status for stale pending request',()=>assert.match(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Đã hủy',hasCareEvents:false}),/đã được hủy/));
test('admin cannot cancel completed booking',()=>assert.match(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Hoàn tất',hasCareEvents:false}),/hoàn tất/));
test('admin cannot cancel a started booking',()=>assert.match(cancellationDecisionIssue({requestStatus:'pending',bookingStatus:'Đang thực hiện',hasCareEvents:false}),/đang thực hiện/));

test('paid booking still waiting Admin approval may request cancellation',()=>assert.equal(cancellationRequestIssue({...sample,status:'Đang chờ xác nhận',paid:true}),null));
test('paid unserved booking may request cancellation on appointment day for refund',()=>assert.equal(cancellationRequestIssue({...sample,paid:true,bookingDate:sample.today}),null));
test('unpaid booking waiting Admin confirmation cannot request reviewed cancellation',()=>assert.ok(cancellationRequestIssue({...sample,status:'Đang chờ xác nhận',paid:false})));

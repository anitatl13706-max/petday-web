import test from 'node:test';
import assert from 'node:assert/strict';
import {refundAmountIssue} from '../src/refundRules.js';
test('full manual refund amount is valid',()=>assert.equal(refundAmountIssue(220000,220000,''),null));
test('partial refund requires reason',()=>assert.match(refundAmountIssue(100000,220000,''),/lý do/));
test('partial refund with clear reason is valid',()=>assert.equal(refundAmountIssue(100000,220000,'Khách đổi lịch sát giờ hẹn'),null));
test('refund cannot exceed recorded receipt',()=>assert.match(refundAmountIssue(230000,220000,'Đã kiểm tra'),/vượt quá/));
test('refund cannot be zero',()=>assert.match(refundAmountIssue(0,220000,'Đã kiểm tra'),/lớn hơn 0/));
test('refund cannot be a fractional VND amount',()=>assert.match(refundAmountIssue(1.5,220000,'Đã kiểm tra'),/lớn hơn 0/));

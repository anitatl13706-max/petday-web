import test from 'node:test';
import assert from 'node:assert/strict';
import {automaticRemindersEnabled,isReminderEligible,tomorrowInVietnam} from '../src/reminders.js';
test('automatic reminders disabled by default',()=>assert.equal(automaticRemindersEnabled(undefined),false));
test('automatic reminders require explicit true value',()=>assert.equal(automaticRemindersEnabled('true'),true));
test('other values cannot accidentally enable reminders',()=>{for(const value of ['false','TRUE','1','yes',''])assert.equal(automaticRemindersEnabled(value),false)});
test('confirmed tomorrow appointment is eligible',()=>{const now=new Date('2026-11-03T08:00:00Z');assert.equal(isReminderEligible({bookingDate:tomorrowInVietnam(now),status:'Đã xác nhận',alreadySent:false},now),true)});

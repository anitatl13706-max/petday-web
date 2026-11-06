import test from 'node:test';
import assert from 'node:assert/strict';
import {localDateInVietnam,tomorrowInVietnam,isReminderEligible} from '../src/reminders.js';
const now=new Date('2026-11-03T17:20:00.000Z'); // 00:20 on Nov 4 in Viet Nam
const booked={bookingDate:'2026-11-05',status:'Đã xác nhận',alreadySent:false};
test('business date follows Viet Nam midnight',()=>assert.equal(localDateInVietnam(now),'2026-11-04'));
test('tomorrow uses Viet Nam day boundary',()=>assert.equal(tomorrowInVietnam(now),'2026-11-05'));
test('confirmed tomorrow can be reminded',()=>assert.equal(isReminderEligible(booked,now),true));
test('pending booking never gets reminder',()=>assert.equal(isReminderEligible({...booked,status:'Đang chờ xác nhận'},now),false));
test('already reminded booking skipped',()=>assert.equal(isReminderEligible({...booked,alreadySent:true},now),false));
test('cancelled booking never gets reminder',()=>assert.equal(isReminderEligible({...booked,status:'Đã hủy'},now),false));
test('wrong date is not eligible',()=>assert.equal(isReminderEligible({...booked,bookingDate:'2026-11-06'},now),false));

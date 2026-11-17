import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePetDayPhone} from '../src/phone.mjs';
import {PAYMENT_QR_MINUTES,bookingQrAmount,qrPayload,reportWindowOpen} from '../src/paymentQrRules.mjs';
test('phone 0 and +84 are the same identifier',()=>assert.equal(normalizePetDayPhone('+84 912 345 678'),normalizePetDayPhone('0912345678')));
test('phone accepts plain 84 international prefix',()=>assert.equal(normalizePetDayPhone('84912345678'),'0912345678'));
test('phone rejects email and invalid formats',()=>{assert.equal(normalizePetDayPhone('test@example.com'),null);assert.equal(normalizePetDayPhone('1234'),null)});
test('QR demo session is 15 minutes and never bank-payable',()=>{assert.equal(PAYMENT_QR_MINUTES,15);assert.match(qrPayload('booking','PD-ABCDEF1234',220000),/NO-BANK-TRANSFER/)});
test('reporting requires a valid unreported server-side QR window',()=>{
 const now=new Date('2026-11-10T10:10:00Z');
 assert.equal(reportWindowOpen({expires_at:'2026-11-10T10:15:00Z',reported_at:null},now),true);
 assert.equal(reportWindowOpen({expires_at:'2026-11-10T10:10:00Z',reported_at:null},now),false);
 assert.equal(reportWindowOpen({expires_at:'2026-11-10T10:15:00Z',reported_at:'2026-11-10T10:09:00Z'},now),false);
});
test('140k cash deposit QR uses exactly the required 20 percent amount',()=>{
 assert.equal(bookingQrAmount({total:140000,paidSoFar:0,depositRequired:28000,paymentMethod:'cash',paymentPlan:'DEPOSIT_20'}),28000);
});
test('140k cash full prepayment QR ignores the deposit cap',()=>{
 assert.equal(bookingQrAmount({total:140000,paidSoFar:0,depositRequired:28000,paymentMethod:'cash',paymentPlan:'FULL_PREPAY'}),140000);
});
test('140k bank transfer QR always uses the full outstanding amount',()=>{
 assert.equal(bookingQrAmount({total:140000,paidSoFar:0,depositRequired:28000,paymentMethod:'bank_transfer',paymentPlan:'FULL_PREPAY'}),140000);
});
test('180k payment plans keep deposit and full settlement amounts separate',()=>{
 assert.equal(bookingQrAmount({total:180000,paidSoFar:0,depositRequired:36000,paymentMethod:'cash',paymentPlan:'DEPOSIT_20'}),36000);
 assert.equal(bookingQrAmount({total:180000,paidSoFar:0,depositRequired:36000,paymentMethod:'cash',paymentPlan:'FULL_PREPAY'}),180000);
 assert.equal(bookingQrAmount({total:180000,paidSoFar:0,depositRequired:36000,paymentMethod:'bank_transfer',paymentPlan:'FULL_PREPAY'}),180000);
});
test('a satisfied deposit never marks the remaining cash balance as collected',()=>{
 assert.equal(bookingQrAmount({total:180000,paidSoFar:36000,depositRequired:36000,paymentMethod:'cash',paymentPlan:'DEPOSIT_20'}),0);
});

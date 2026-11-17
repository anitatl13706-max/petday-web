import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decidePrepaymentPolicy,PREPAYMENT_REASONS} from '../src/prepaymentPolicy.mjs';

const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../../database/066_v6131_customer_prepayment_policy.sql',import.meta.url),'utf8');
const portal=readFileSync(new URL('../../src/Portal.tsx',import.meta.url),'utf8');

test('new account without a completed service must prepay',()=>{
 assert.deepEqual(decidePrepaymentPolicy({hasCompletedService:false,recentTerminalOutcomes:[]}),{required:true,reason:PREPAYMENT_REASONS.NO_COMPLETED_SERVICE});
});

test('one completed service makes every pet on the account eligible for cash pay-later',()=>{
 assert.equal(decidePrepaymentPolicy({hasCompletedService:true,recentTerminalOutcomes:['completed']}).required,false);
 assert.match(server,/WHERE customer_id=\$1 AND status='Hoàn tất'/);
 assert.doesNotMatch(server,/customerPrepaymentPolicy[\s\S]{0,1800}pet_id/);
});

test('two latest customer cancellations require prepayment across different pets',()=>{
 const result=decidePrepaymentPolicy({hasCompletedService:true,recentTerminalOutcomes:['customer_cancel','customer_cancel']});
 assert.equal(result.required,true);assert.equal(result.reason,PREPAYMENT_REASONS.TWO_CONSECUTIVE_CUSTOMER_CANCELLATIONS);
});

test('provider cancellation and no-show are not customer cancellations and break the streak',()=>{
 assert.equal(decidePrepaymentPolicy({hasCompletedService:true,recentTerminalOutcomes:['provider_cancel','customer_cancel']}).required,false);
 assert.equal(decidePrepaymentPolicy({hasCompletedService:true,recentTerminalOutcomes:['no_show','customer_cancel']}).required,false);
});

test('backend exposes a no-store account policy and frontend refreshes it after login/reload',()=>{
 assert.match(server,/app\.get\('\/api\/me\/prepayment-policy',auth/);
 assert.match(server,/Cache-Control','no-store'/);
 assert.match(portal,/api\("\/me\/prepayment-policy", "GET", undefined, t\)/);
 assert.match(portal,/quoteNeedsPrepayment/);
});

test('in-progress booking is not treated as completed',()=>{
 assert.equal(decidePrepaymentPolicy({hasCompletedService:false,recentTerminalOutcomes:['in_progress']}).required,true);
});

test('cancellation audit migration preserves origin without changing booking money',()=>{
 assert.match(migration,/booking_cancellation_events/);
 assert.match(migration,/origin IN \('customer','provider','no_show','system'\)/);
 assert.doesNotMatch(migration,/UPDATE\s+bookings/i);
 assert.doesNotMatch(migration,/payment_status|payment_plan|total\s*=/i);
});

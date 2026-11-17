import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customerCancellationV120 as cancel} from '../src/customerCancellationV120.mjs';
const base={date:'2026-12-05',slot:'08:30',requestedAt:'2026-12-04T12:00:00+07:00',careCharge:400000,carePaid:400000,fullyPaid:true};
test('exactly 1h before: deposit holder cannot self cancel',()=>assert.equal(cancel({...base,requestedAt:'2026-12-05T07:30:00+07:00',carePaid:60000,fullyPaid:false,hasDeposit:true}).allowed,false));
test('exactly 1h before: rescheduled booking cannot self cancel',()=>assert.equal(cancel({...base,requestedAt:'2026-12-05T07:30:00+07:00',customerRescheduled:true}).allowed,false));
test('full payment refunded 80% of service+Taxi booking total',()=>assert.equal(cancel(base).refundAmount,320000));
test('only deposit paid: no refund',()=>assert.equal(cancel({...base,carePaid:60000,fullyPaid:false,hasDeposit:true}).refundAmount,0));
test('provider fault always refunds confirmed actually collected',()=>assert.equal(cancel({...base,carePaid:60000,fullyPaid:false,providerFault:true,requestedAt:'2026-12-08T08:30:00+07:00'}).refundAmount,60000));

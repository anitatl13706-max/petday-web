import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceRefundBase} from '../src/refundSplit.mjs';
test('split 200k service + 140k Taxi',()=>assert.equal(serviceRefundBase(340000,[{type:'taxi',amount:140000},{type:'service',amount:200000}]),200000));
test('split retail add-on separately',()=>assert.equal(serviceRefundBase(400000,[{type:'taxi',amount:70000},{type:'retail',amount:30000}]),300000));
test('a promotion never creates a negative service balance',()=>assert.equal(serviceRefundBase(50000,[{type:'taxi',amount:70000}]),0));
test('zero taxi booking retains original base',()=>assert.equal(serviceRefundBase(200000,[{type:'addon',amount:50000}]),200000));

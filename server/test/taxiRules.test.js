import test from 'node:test';
import assert from 'node:assert/strict';
import {taxiQuote} from '../src/taxiRules.js';
test('Taxi off is free',()=>assert.equal(taxiQuote(undefined).fee,0));
test('Nearby fare is server owned',()=>assert.equal(taxiQuote({enabled:true,zone:'nearby',address:'123 đường Nguyễn Văn A, phường 1',phone:'0912345678'}).fee,70000));
test('Extended fare is server owned',()=>assert.equal(taxiQuote({enabled:true,zone:'extended',address:'123 đường Nguyễn Văn A, phường 1',phone:'0912345678'}).fee,120000));
test('Unrecognized zone rejected',()=>assert.throws(()=>taxiQuote({enabled:true,zone:'other',address:'123 đường Nguyễn Văn A',phone:'0912345678'})));
test('Short pickup address rejected',()=>assert.throws(()=>taxiQuote({enabled:true,zone:'nearby',address:'A',phone:'0912345678'})));
test('Invalid phone rejected',()=>assert.throws(()=>taxiQuote({enabled:true,zone:'nearby',address:'123 đường Nguyễn Văn A',phone:'000'})));

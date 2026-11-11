import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const base = new URL('../../src/', import.meta.url);
const portal = readFileSync(new URL('Portal.tsx',base),'utf8');
const unified = readFileSync(new URL('UnifiedPaymentCenter.tsx',base),'utf8');
const ledger = readFileSync(new URL('FinanceWorkbench.tsx',base),'utf8');
test('finance separates pending, processed, settings and focuses one workflow at a time',()=>{
 assert.match(portal,/financePanel==='payments'/);
 assert.match(portal,/financePanel==='shop'/);
 assert.match(portal,/financePanel==='refunds'/);
 assert.match(portal,/financeScope==='todo'&&financePanel==='shop'&&<AdminRetailPayments/);
 assert.match(portal,/financeScope!=='settings'&&financePanel==='payments'&&<FinanceWorkbench/);
 assert.match(portal,/financeScope!=='settings'&&financePanel==='refunds'&&<section/);
 assert.match(portal,/financeScope==='history'&&financePanel==='payments'&&<details/);
 assert.match(portal,/financeScope==='history'&&financePanel==='shop'/);
});
test('service payment avoids duplicate confirmation workspace and shop remains available',()=>{
 assert.doesNotMatch(portal,/<UnifiedPaymentCenter /);
 assert.match(unified,/export function AdminRetailPayments\(/);
 assert.match(ledger,/settlement\.outstanding/);
 assert.match(ledger,/Kiểm tra số còn thu & xác nhận/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const portal=read('../../src/Portal.tsx'),dialog=read('../../src/CareCompletionDialog.tsx'),server=read('../src/server.js');
test('single admin cash completion opens a settlement-based dialog with no default cash confirmation',()=>{assert.match(portal,/onClick=\{\(\) => void openCareCompletion\(b\)\}/);assert.match(portal,/settlement.*GET/);assert.match(portal,/outstanding:q\.outstanding,choice:null/);assert.doesNotMatch(portal,/Chăm sóc xong · chưa thu đủ<\/button>/);});
test('cash choice is explicit; cancelling dialog sends no checkout',()=>{assert.match(dialog,/quote\.outstanding>0&&!quote\.choice/);assert.match(dialog,/onClick=\{onCancel\}/);assert.match(portal,/received:q\.choice==="received"/);});
test('server rejects stale settlement before recording checkout or cash',()=>{assert.match(server,/d\.expectedCashAmount!==settlementBefore\.outstanding/);assert.match(server,/cashEligible&&d\.cashReceived===true/);assert.match(server,/d\.closeWithoutPayment===true&&\(!cashEligible\|\|d\.cashReceived===true\)/);});
test('unpaid finished care stays visible and can settle from the booking card',()=>{assert.match(portal,/Xác nhận thu đủ tiền còn lại/);assert.match(portal,/path\+"\/receipts"/);assert.match(portal,/matchesBookingGroup\(b,bookingFilter\)/);assert.match(server,/finished\.rowCount\)await c\.query\("UPDATE bookings SET status='Hoàn tất'/);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../../src/Portal.tsx',import.meta.url),'utf8');
const snapshot=readFileSync(new URL('../../src/BookingFinancialSnapshot.tsx',import.meta.url),'utf8');
const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('finance has one refund workspace with switchable service and taxi ledgers',()=>{
 assert.match(portal,/Hồ sơ hoàn tiền/);
 assert.match(portal,/refundCategory==='service'\?<ExceptionRefundCenter/);
 assert.match(portal,/:<TaxiRefundCenter/);
 assert.doesNotMatch(portal,/<BookingSettlementPanel token=/);
});
test('customer completed service review uses clickable stars and existing post endpoint',()=>{
 assert.match(portal,/role="radiogroup" aria-label="Chọn số sao đánh giá"/);
 assert.match(portal,/update\(`\/bookings\/\$\{b.code\}\/review`,'POST'/);
});
test('schema diagnostic checks real settlement columns and invoice explains 503',()=>{
 assert.match(server,/pet_taxi_legs:\['id','booking_id','leg','fee','state','refund_due'\]/);
 assert.match(server,/taxi_refund_requests:\['id','taxi_leg_id','booking_id','amount','status','refund_reference'\]/);
 assert.match(snapshot,/Kết quả \/api\/health\/schema chỉ kiểm tra một số bảng\/cột/);
});

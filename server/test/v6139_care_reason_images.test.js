import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const portal=readFileSync(new URL('../../src/Portal.tsx',import.meta.url),'utf8');
const picker=readFileSync(new URL('../../src/CareEventImages.tsx',import.meta.url),'utf8');
const stopped=server.slice(server.indexOf("app.post('/api/admin/bookings/:code/incomplete'"),server.indexOf('// V6.14: tracked care'));
test('stopped service records reason and returns its event id atomically; no financial mutation',()=>{
 assert.match(stopped,/note:z\.string\(\)\.trim\(\)\.min\(10\)/);
 assert.match(stopped,/recordedNote=d\.reason\+/);
 assert.match(stopped,/RETURNING id,event_type,created_at/);
 assert.match(stopped,/id:created\.rows\[0\]\.id/);
 assert.doesNotMatch(stopped,/INSERT INTO booking_payment_receipts|UPDATE bookings SET payment_status|INSERT INTO refund_requests/);
});
test('legacy clarification only for incomplete records with no previous incomplete event; no status change',()=>{
 assert.match(stopped,/d\.supplement \? b\.status!=='Không hoàn thành'/);
 assert.match(stopped,/steps\.has\('incomplete'\)/);
 assert.match(stopped,/if\(!d\.supplement\)await c\.query\("UPDATE bookings/);
 assert.match(stopped,/\[Bổ sung lý do cho lịch cũ\]/);
});
test('timeline labels reason and note and handles historical missing reason explicitly',()=>{
 assert.match(portal,/readIncompleteNote\(e\.note\)\.reason/);
 assert.match(portal,/readIncompleteNote\(e\.note\)\.note/);
 assert.match(portal,/Chưa có lý do dừng dịch vụ được lưu/);
});
test('native local file picker and stopped event image upload keep failed files for retry',()=>{
 assert.match(picker,/type="file" accept="\.jpg,\.jpeg,\.png,\.webp/);
 assert.match(picker,/inputRef\.current\?\.click\(\)/);
 assert.match(portal,/uploadCareEventImages\(b\.code, Number\(created\.id\), files, token\)/);
 assert.match(portal,/\[b\.code\]:failed\.length\?\{eventId:Number\(created\.id\)\}/);
});
test('cash completion requires positive confirmation and separate unpaid path',()=>{
 assert.match(portal,/cashReceived = true/);
 assert.match(server,/cashEligible&&d\.cashReceived===true/);
 assert.match(server,/UPDATE bookings SET payment_status='Đã thanh toán',status='Hoàn tất'/);
 assert.match(server,/cashReceived!==true&&d\.closeWithoutPayment!==true/);
});

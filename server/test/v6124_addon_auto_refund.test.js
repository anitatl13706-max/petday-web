import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('const customerAutomaticCancellation = handler'),source.indexOf("app.post('/api/bookings/:code/cancellation-request'"));
test('cancel treats Pet Taxi addon as part of booking value',()=>{
 assert.match(handler,/const careCharge=Number\(b.total\)/);
 assert.doesNotMatch(handler,/await autoApproveTaxiRefunds/);
});
test('no cancellation endpoint invents a completed bank refund',()=>{
 assert.match(handler,/refundTransferCompleted:false/);
 assert.match(handler,/status='approved'/);
 assert.doesNotMatch(handler,/TEST-CARE|demoRefundRecorded|SET status='completed'/);
});

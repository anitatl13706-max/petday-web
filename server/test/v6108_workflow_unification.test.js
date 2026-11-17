import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const api=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const portal=fs.readFileSync(new URL('../../src/Portal.tsx',import.meta.url),'utf8');
test('both cancellation endpoints use the same transactional handler',()=>{
 assert.match(api,/app\.post\('\/api\/bookings\/:code\/cancellation-request',auth,customerAutomaticCancellation\)/);
 assert.match(api,/app\.patch\('\/api\/bookings\/:code\/cancel',auth,customerAutomaticCancellation\)/);
 assert.equal((api.match(/app\.patch\('\/api\/bookings\/:code\/cancel'/g)||[]).length,1);
 assert.doesNotMatch(portal,/update\(`\/bookings\/\$\{b\.code\}\/cancel`/);
});
test('Taxi add-on never creates a new separate refund; legacy ledger remains auditable',()=>{
 const body=api.slice(api.indexOf("app.post('/api/admin/taxi-refunds/:legId'"),api.indexOf("app.patch('/api/admin/taxi-refunds/:id'"));
 assert.match(body,/return fail\(res,409/);
 assert.doesNotMatch(api,/INSERT INTO taxi_refund_requests|autoApproveTaxiRefunds/);
 assert.match(api,/FROM taxi_refund_requests r JOIN pet_taxi_legs/);
});

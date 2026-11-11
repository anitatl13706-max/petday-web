import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canCloseWithCustomerHandoff,canDepartReturnTaxi} from '../src/handoffRules.js';
const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../../database/057_v6104111_legacy_pending_return.sql',import.meta.url),'utf8');
test('Care completion does not automatically close the appointment',()=>{
  const start=server.indexOf("app.post(['/api/admin/bookings/:code/milestone'");
  const area=server.slice(start,start+9000);
  assert.match(area,/if\(d\.eventType==='pet_handed_over'\)await c\.query\("UPDATE bookings SET status='Hoàn tất'/);
  assert.doesNotMatch(area,/if\(d\.eventType==='check_out'\)await c\.query\("UPDATE bookings SET status='Hoàn tất'/);
});
test('Return Taxi can depart after care, and customer handoff cannot bypass active Taxi',()=>{
  assert.equal(canDepartReturnTaxi({careCompleted:true,returnState:'confirmed'}),true);
  assert.equal(canDepartReturnTaxi({careCompleted:false,returnState:'confirmed'}),false);
  assert.equal(canCloseWithCustomerHandoff({bookingStatus:'Đang thực hiện',careCompleted:true,alreadyHandedOver:false,returnState:'en_route'}),false);
});
test('Legacy migration targets only a completed booking with missing return handoff and incomplete return leg',()=>{
  assert.match(migration,/b\.status='Hoàn tất'/);
  assert.match(migration,/s\.event_type='check_out'/);
  assert.match(migration,/s\.event_type='pet_handed_over'/);
  assert.match(migration,/l\.leg='return'/);
  assert.match(migration,/l\.state NOT IN \('completed'/);
  assert.doesNotMatch(migration,/DELETE FROM|TRUNCATE/i);
});

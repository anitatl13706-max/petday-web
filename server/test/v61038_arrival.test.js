import test from 'node:test';
import assert from 'node:assert/strict';
import {careStepIssue,noShowIssue} from '../src/staffRules.js';
test('legacy separate check-in requires reception; new reception creates both milestones atomically',()=>{
  assert.match(careStepIssue('check_in',{status:'Đã xác nhận',hasPetArrived:false,hasCheckIn:false,hasCareUpdate:false,hasReady:false,hasCheckOut:false}),/tiếp nhận pet/);
  assert.equal(careStepIssue('pet_arrived',{status:'Đã xác nhận',hasPetArrived:false,hasCheckIn:false}),null);
  assert.equal(careStepIssue('check_in',{status:'Đã xác nhận',hasPetArrived:true,hasCheckIn:false}),null);
});
test('cannot double receive or start',()=>{
 assert.ok(careStepIssue('pet_arrived',{status:'Đã xác nhận',hasPetArrived:true,hasCheckIn:false}));
 assert.ok(careStepIssue('check_in',{status:'Đã xác nhận',hasPetArrived:true,hasCheckIn:true}));
});
test('arrived pet cannot be no-show',()=>assert.ok(noShowIssue({status:'Đã xác nhận',hasServiceEvent:true})));

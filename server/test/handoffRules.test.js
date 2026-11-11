import test from 'node:test';import assert from 'node:assert/strict';
import {canCloseWithCustomerHandoff,canDepartReturnTaxi} from '../src/handoffRules.js';
test('care completed without customer handoff remains open',()=>{assert.equal(canCloseWithCustomerHandoff({bookingStatus:'Đang thực hiện',careCompleted:false}),false);});
test('pickup-only direct customer handoff closes',()=>{assert.equal(canCloseWithCustomerHandoff({bookingStatus:'Đang thực hiện',careCompleted:true}),true);});
test('active return Taxi blocks direct handoff',()=>{assert.equal(canCloseWithCustomerHandoff({bookingStatus:'Đang thực hiện',careCompleted:true,returnState:'en_route'}),false);});
test('cancelled return Taxi allows direct handoff',()=>{assert.equal(canCloseWithCustomerHandoff({bookingStatus:'Đang thực hiện',careCompleted:true,returnState:'cancelled'}),true);});
test('return Taxi departure requires care complete',()=>{assert.equal(canDepartReturnTaxi({careCompleted:false,returnState:'confirmed'}),false);assert.equal(canDepartReturnTaxi({careCompleted:true,returnState:'confirmed'}),true);});

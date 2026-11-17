import test from 'node:test';
import assert from 'node:assert/strict';
import {initialTaxiLeg,bootstrapTaxiLegs} from '../src/taxiLegBootstrap.mjs';
const base={id:10,booking_id:20,direction:'round_trip',fee:140000,status:'requested',booking_status:'Đã xác nhận'};
test('Taxi theo lịch đã xác nhận tự ghi nhận từng chiều',()=>{
 assert.deepEqual(initialTaxiLeg(base,'pickup'),{fee:70000,state:'confirmed',refundDue:0});
 assert.deepEqual(initialTaxiLeg(base,'return'),{fee:70000,state:'confirmed',refundDue:0});
});
test('Lịch đã đóng không làm sống lại chiều Taxi chưa thực hiện',()=>{
 assert.deepEqual(initialTaxiLeg({...base,booking_status:'Đã hủy'},'pickup'),{fee:70000,state:'cancelled',refundDue:0});
 assert.deepEqual(initialTaxiLeg({...base,booking_status:'Đã hủy'},'return'),{fee:70000,state:'cancelled',refundDue:0});
});
test('Đã đón pet thì giữ chiều đón hoàn tất và đóng chiều về khi lịch hủy',()=>{
 const x={...base,status:'completed',booking_status:'Đã hủy'};
 assert.equal(initialTaxiLeg(x,'pickup').state,'completed');
 assert.deepEqual(initialTaxiLeg(x,'return'),{fee:70000,state:'cancelled',refundDue:0});
});
test('Taxi chiều về độc lập không bị coi đã hoàn tất chiều đón',()=>{
 const x={...base,direction:'return',fee:70000,status:'completed',booking_status:'Hoàn tất'};
 assert.deepEqual(initialTaxiLeg(x,'return'),{fee:70000,state:'completed',refundDue:0});
});
test('Bootstrap ghi đúng phí hai lượt, không phát sinh khoản hoàn',async()=>{
 const calls=[];
 await bootstrapTaxiLegs({query:async(sql,args)=>{calls.push({sql,args});return {rowCount:1}}},{...base,booking_status:'Đã hủy'});
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(x=>x.args.slice(-3)),[[70000,'cancelled',0],[70000,'cancelled',0]]);
});

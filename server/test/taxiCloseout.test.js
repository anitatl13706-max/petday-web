import test from 'node:test';
import assert from 'node:assert/strict';
import {closeUnusedTaxiLegs} from '../src/taxiCloseout.mjs';

function db(legs){
 const queries=[];
 return {
  queries,
  async query(sql,args){
   queries.push({sql,args});
   if(sql.includes('FROM pet_taxi_requests t JOIN bookings b'))return {rows:[],rowCount:0};
   if(sql.includes('SELECT id,leg,state,fee FROM pet_taxi_legs')){
    const rows=legs.filter(x=>['requested','confirmed'].includes(x.state));
    return {rows,rowCount:rows.length};
   }
   if(sql.includes('UPDATE pet_taxi_legs SET state=')){
    const l=legs.find(x=>x.id===args[0]);l.state='cancelled';assert.doesNotMatch(sql,/refund_due\s*=/i);return {rowCount:1};
   }
   if(sql.includes('SELECT 1 FROM pet_taxi_legs')){
    const active=legs.some(x=>['requested','confirmed','en_route','arrived','contacting','under_review'].includes(x.state));
    return {rowCount:active?1:0};
   }
   return {rowCount:1};
  }
 };
}
test('No-show đóng hai chiều chưa xuất phát, lưu sự kiện nhưng không tạo hoàn tiền',async()=>{
 const legs=[{id:1,leg:'pickup',state:'requested',fee:70000},{id:2,leg:'return',state:'confirmed',fee:70000}];
 const c=db(legs);
 assert.equal(await closeUnusedTaxiLegs(c,22,7,'Khách không đến'),2);
 assert.deepEqual(legs.map(l=>l.state),['cancelled','cancelled']);
 assert.deepEqual(legs.map(l=>l.refund_due||0),[0,0]);
 assert.equal(c.queries.filter(x=>x.sql.includes('INSERT INTO pet_taxi_leg_events')).length,2);
 assert.equal(c.queries.filter(x=>x.sql.includes('UPDATE pet_taxi_requests')).length,1);
});
test('Không tự hủy chuyến đã xuất phát, không đóng legacy summary khi còn chuyến chạy',async()=>{
 const legs=[{id:1,leg:'pickup',state:'en_route',fee:70000},{id:2,leg:'return',state:'requested',fee:70000}];
 const c=db(legs);
 assert.equal(await closeUnusedTaxiLegs(c,22,7,'Hủy lịch'),1);
 assert.equal(legs[0].state,'en_route');
 assert.equal(legs[1].state,'cancelled');
 assert.equal(c.queries.filter(x=>x.sql.includes('UPDATE pet_taxi_requests')).length,0);
});
test('Gọi lại không tạo sự kiện hủy Taxi trùng',async()=>{
 const legs=[{id:1,leg:'pickup',state:'confirmed',fee:120000}];
 const c=db(legs);
 await closeUnusedTaxiLegs(c,22,7,'Hủy lịch');
 assert.equal(await closeUnusedTaxiLegs(c,22,7,'Hủy lịch'),0);
 assert.equal(c.queries.filter(x=>x.sql.includes('INSERT INTO pet_taxi_leg_events')).length,1);
});

test('Đóng lịch trước khi từng mở Taxi: tạo hai chiều rồi đóng ngay, không tái sinh lịch chờ',async()=>{
 const request={id:6,booking_id:22,direction:'round_trip',fee:140000,status:'requested',return_completed_at:null,booking_status:'Đã xác nhận'};
 const legs=[];const events=[];
 const client={async query(sql,args){
  if(sql.includes('FROM pet_taxi_requests t JOIN bookings b'))return {rows:[request],rowCount:1};
  if(sql.includes('INSERT INTO pet_taxi_legs')){
   const [requestId,bookingId,leg,fee,state,refundDue]=args;
   if(!legs.some(x=>x.leg===leg))legs.push({id:legs.length+1,leg,fee,state,refund_due:refundDue});
   return {rowCount:1};
  }
  if(sql.includes('SELECT id,leg,state,fee FROM pet_taxi_legs')){
   const rows=legs.filter(x=>['requested','confirmed'].includes(x.state));return {rows,rowCount:rows.length};
  }
  if(sql.includes('UPDATE pet_taxi_legs SET state=')){
   const item=legs.find(x=>x.id===args[0]);item.state='cancelled';assert.doesNotMatch(sql,/refund_due\s*=/i);return {rowCount:1};
  }
  if(sql.includes('INSERT INTO pet_taxi_leg_events')){events.push(args);return {rowCount:1};}
  if(sql.includes('SELECT 1 FROM pet_taxi_legs'))return {rowCount:legs.some(x=>['requested','confirmed','en_route','arrived','contacting','under_review'].includes(x.state))?1:0};
  return {rowCount:1};
 }};
 assert.equal(await closeUnusedTaxiLegs(client,22,7,'Đóng lịch'),2);
 assert.deepEqual(legs.map(x=>[x.state,x.refund_due]),[['cancelled',0],['cancelled',0]]);
 assert.equal(events.length,2);
 assert.equal(await closeUnusedTaxiLegs(client,22,7,'Đóng lịch'),0);
 assert.equal(events.length,2);
});

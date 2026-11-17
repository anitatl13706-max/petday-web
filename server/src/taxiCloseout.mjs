import {bootstrapTaxiLegs} from './taxiLegBootstrap.mjs';
// V6.142: close unused transport operations without changing fees, preserving in-flight/completed trips.
// Called within the existing booking transaction; never marks money actually refunded.
export async function closeUnusedTaxiLegs(client,bookingId,actorId,reason){
 // Hydrate any unvisited Taxi requests before closing their pending directions.
 // Otherwise opening the Taxi panel later could recreate a pending leg.
 const legacy=await client.query(`SELECT t.id,t.booking_id,t.direction,t.fee,t.status,t.return_completed_at,
   b.status AS booking_status FROM pet_taxi_requests t JOIN bookings b ON b.id=t.booking_id
   WHERE t.booking_id=$1 FOR UPDATE OF t`,[bookingId]);
 for(const request of legacy.rows)await bootstrapTaxiLegs(client,request);
 const legs=await client.query("SELECT id,leg,state,fee FROM pet_taxi_legs WHERE booking_id=$1 AND state IN ('requested','confirmed') FOR UPDATE",[bookingId]);
 for(const leg of legs.rows){
  await client.query("UPDATE pet_taxi_legs SET state='cancelled',issue_note=$2,updated_by=$3,updated_at=now() WHERE id=$1",[leg.id,reason,actorId]);
  await client.query('INSERT INTO pet_taxi_leg_events(taxi_leg_id,actor_id,action,previous_state,next_state,note) VALUES($1,$2,$3,$4,$5,$6)',[leg.id,actorId,'booking_closed',leg.state,'cancelled',reason]);
 }
 // Legacy summary is closed only when there are no active/in-flight leg records.
 const active=await client.query("SELECT 1 FROM pet_taxi_legs WHERE booking_id=$1 AND state IN ('requested','confirmed','en_route','arrived','contacting','under_review') LIMIT 1",[bookingId]);
 if(!active.rowCount){await client.query("UPDATE pet_taxi_requests SET status='cancelled',updated_by=$2,updated_at=now() WHERE booking_id=$1 AND status IN ('requested','confirmed')",[bookingId,actorId]);}
 return legs.rowCount;
}

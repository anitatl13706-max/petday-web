/** Reconcile legacy Taxi requests with the two independent Taxi legs.
 * This must run BEFORE booking closeout so a never-opened Taxi panel cannot
 * resurrect an unserved trip after cancellation or No-show.
 */
export function initialTaxiLeg(request, leg) {
  const fee = request.direction === 'round_trip' ? Math.floor(Number(request.fee) / 2) : Number(request.fee);
  const delivered = leg === 'pickup'
    ? request.status === 'completed' && request.direction !== 'return'
    : request.direction === 'return' && request.status === 'completed' || Boolean(request.return_completed_at);
  const closed = request.booking_status === 'Đã hủy' || request.status === 'cancelled';
  const state = delivered ? 'completed' : closed ? 'cancelled' : (request.status === 'confirmed' || ['Đã xác nhận','Đang thực hiện','Hoàn tất'].includes(request.booking_status)) ? 'confirmed' : 'requested';
  return {fee, state, refundDue: 0};
}

export async function bootstrapTaxiLegs(client, request) {
  if (!request) return;
  const legs = request.direction === 'round_trip' ? ['pickup', 'return'] : [request.direction];
  for (const leg of legs) {
    const value = initialTaxiLeg(request, leg);
    await client.query(`INSERT INTO pet_taxi_legs(taxi_request_id,booking_id,leg,fee,state,refund_due)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(taxi_request_id,leg) DO NOTHING`,
      [request.id,request.booking_id,leg,value.fee,value.state,value.refundDue]);
  }
}

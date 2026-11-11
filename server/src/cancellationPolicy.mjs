/** PetDay V6.103.5 cancellation terms, measured at the actual request timestamp.
 * Appointment wall time is in Asia/Ho_Chi_Minh (UTC+07, no DST).
 * No banking action is performed by these pure functions.
 */
export function cancellationPolicy({date,slot,requestedAt,total=0}) {
 const appointmentMs=Date.parse(`${date}T${String(slot).slice(0,5)}:00+07:00`);
 const requestedMs=new Date(requestedAt).getTime();
 const amount=Number(total);
 if(!Number.isFinite(appointmentMs)||!Number.isFinite(requestedMs)||!Number.isSafeInteger(amount)||amount<0)
  return {window:'invalid',percentage:0,refundAmount:0,label:'Không xác định được điều kiện hủy'};
 const hours=(appointmentMs-requestedMs)/3600000;
 if(hours<=0)return {window:'started',percentage:0,refundAmount:0,label:'Đã đến giờ hẹn'};
 if(hours>24)return {window:'early',percentage:100,refundAmount:amount,label:'Trước hơn 24 giờ'};
 if(hours>3)return {window:'mid',percentage:80,refundAmount:Math.round(amount*0.8),label:'Trước hơn 3 giờ đến 24 giờ'};
 return {window:'late',percentage:0,refundAmount:0,label:'Hủy sát giờ (từ 0 đến 3 giờ)'};
}
export function cancellationPolicyFromBooking(booking,requestedAt){
 return cancellationPolicy({date:booking.date,slot:booking.slot,requestedAt,total:booking.total});
}

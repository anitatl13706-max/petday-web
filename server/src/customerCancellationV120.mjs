/** V6.120 policy: customer cancellations of unstarted services. Taxi refunds use their own ledger. */
export function customerCancellationV120({date,slot,requestedAt,careCharge=0,carePaid=0,fullyPaid=false,hasDeposit=false,customerRescheduled=false,providerFault=false}) {
 const at=Date.parse(`${String(date).slice(0,10)}T${String(slot).slice(0,5)}:00+07:00`);
 const now=new Date(requestedAt).getTime();
 const base=Number(careCharge),received=Number(carePaid);
 if(!Number.isFinite(at)||!Number.isFinite(now)||!Number.isSafeInteger(base)||base<0||!Number.isSafeInteger(received)||received<0)
  return {allowed:false,refundAmount:0,percentage:0,reason:'Không xác định được dữ liệu lịch hoặc tiền thực thu',window:'invalid'};
 const hours=(at-now)/3600000;
 if(providerFault)return {allowed:true,refundAmount:received,percentage:100,reason:'PetDay không thể phục vụ và không có lịch thay thế',window:'provider'};
 if(hours<=1)return {allowed:false,refundAmount:0,percentage:0,reason:'Còn tối đa 1 giờ hoặc đã qua giờ hẹn: không được tự hủy; liên hệ PetDay hỗ trợ',window:'late'};
 if(customerRescheduled)return {allowed:true,refundAmount:0,percentage:0,reason:'Khách đã đổi lịch thành công: không hoàn phí khi khách hủy',window:'rescheduled'};
 if(received===0)return {allowed:true,refundAmount:0,percentage:0,reason:'Chưa thanh toán: không phát sinh hoàn tiền',window:'unpaid'};
 if(hasDeposit&&!fullyPaid)return {allowed:true,refundAmount:0,percentage:0,reason:'Chỉ mới cọc 20%: cọc không hoàn khi khách hủy',window:'deposit'};
 if(!fullyPaid)return {allowed:true,refundAmount:0,percentage:0,reason:'Chưa thanh toán đủ: không tự động hoàn tiền',window:'partial'};
 return {allowed:true,refundAmount:Math.round(received*.8),percentage:80,reason:'Đã thanh toán đủ, hủy trước hơn 1 giờ: hoàn 80% tổng tiền thực thu của đơn',window:'full'};
}

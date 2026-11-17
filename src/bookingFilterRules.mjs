/** Shared booking grouping: service progress and outstanding payment are independent. */
export function bookingGroup(b){
 if(b.noShowReason||b.status==='Không đến')return 'no-show';
 if(b.status==='Đã hủy')return 'cancelled';
 if(b.status==='Không hoàn thành')return 'incomplete';
 if(b.status==='Đang chờ xác nhận')return 'pending';
 if(b.status==='Hoàn tất'||(b.status==='Đang thực hiện'&&b.careCompleted))return b.paymentStatus==='Đã thanh toán'?'done':'pending';
 if(b.status==='Đã xác nhận')return 'confirmed';
 if(b.status==='Đang thực hiện')return 'active';
 return 'other';
}
export function matchesBookingGroup(b,group){
 const actual=bookingGroup(b);
 return group==='all'||group===actual||(group==='processing'&&['confirmed','active','pending'].includes(actual));
}
export function matchesBookingPeriod(b,period,today){
 return period==='all'||period==='custom'||(period==='today'&&b.date===today)||(period==='upcoming'&&b.date>today);
}
export function matchesBookingFilters(booking,{branch='all',start='',end=''}={}){
 if(branch!=='all'&&booking.branch!==branch)return false;
 if(start&&booking.date<start)return false;
 if(end&&booking.date>end)return false;
 return true;
}

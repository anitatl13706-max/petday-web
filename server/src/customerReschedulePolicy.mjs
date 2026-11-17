/** Customer appointment rescheduling, Vietnam local wall-clock times. */
const DAY=86400000;
export function vietnamAppointmentMs(date,slot){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(slot).slice(0,5)))return NaN;
  return Date.parse(`${date}T${String(slot).slice(0,5)}:00+07:00`);
}
export function vietnamDay(ms){return new Date(ms+7*3600000).toISOString().slice(0,10);}
export function vietnamAddDays(day,count){const ms=Date.parse(day+'T00:00:00Z');return new Date(ms+count*DAY).toISOString().slice(0,10);}
export function customerReschedulePolicy({date,slot,now=Date.now()}){
 const appt=vietnamAppointmentMs(date,slot), current=Number(now);
 if(!Number.isFinite(appt)||!Number.isFinite(current))return {mode:'invalid',message:'Không xác định được giờ hẹn.'};
 const remaining=appt-current;
 if(remaining>3*3600000)return {mode:'automatic',maxDate:vietnamAddDays(vietnamDay(current),7),message:'Đổi tự động trong phạm vi đặt trước 7 ngày.'};
 if(remaining>3600000)return {mode:'automatic',maxDate:vietnamAddDays(date,1),message:'Chỉ đổi trong ngày hẹn hoặc ngày kế tiếp.'};
 if(remaining>0)return {mode:'assisted',maxDate:vietnamAddDays(date,1),message:'Còn từ 1 giờ trở xuống: nhân viên xem xét hỗ trợ.'};
 return {mode:'assisted',maxDate:vietnamAddDays(date,1),message:'Đã đến/trễ giờ hẹn: liên hệ nhân viên trong ngày hẹn để được xem xét hỗ trợ.'};
}
export function rescheduleTargetIssue({date,slot,targetDate,targetSlot,now=Date.now()}){
 const p=customerReschedulePolicy({date,slot,now});
 if(p.mode==='invalid')return p.message;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate)))return 'Ngày mới không hợp lệ.';
 const today=vietnamDay(now);
 if(targetDate<today||targetDate>p.maxDate)return `Ngày mới phải nằm trong phạm vi cho phép (đến ${p.maxDate}).`;
 if(p.mode==='assisted' && targetDate!==date && targetDate!==vietnamAddDays(date,1))return 'Nhân viên chỉ được xem xét ngày hẹn hoặc ngày kế tiếp.';
 if(vietnamAppointmentMs(targetDate,targetSlot)<=now)return 'Giờ mới phải ở tương lai.';
 return null;
}

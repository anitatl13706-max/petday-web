/** Deterministic end-of-day rules in Asia/Ho_Chi_Minh. */
export function vietnamToday(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function bookingFinishDate({service,date,lineItems,category}){
 if(category!=='Daycare')return date;
 // Standard half/full-day Daycare finishes on the booking day. Overnight stays
 // must carry an explicit endDate; never guess their departure date.
 const schedule=(Array.isArray(lineItems)?lineItems:[]).find(x=>x?.type==='schedule'&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.endDate||'')));
 return schedule?.endDate||(['Daycare nửa ngày','Daycare cả ngày'].includes(service)?date:null); // Legacy Daycare with no trustworthy end date is not auto-closed.
}
export function autoCloseDecision({status,finishDate,today,hasArrival=false,hasTaxiArrival=false}){
 if(!finishDate||finishDate>=today)return null;
 if(status==='Đã xác nhận')return hasArrival?'completed':'no_show'; // Arrival is care start; legacy Taxi state is not attendance proof.
 if(status==='Đang thực hiện')return 'completed';
 return null;
}

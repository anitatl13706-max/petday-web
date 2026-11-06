/** Pure presentation rules; backend still verifies payment eligibility in a locked transaction. */
export function canCollect(b){
 return b?.status!=='Đã hủy' && b?.paymentStatus!=='Đã thanh toán';
}
export function filterLedger(bookings,{filter='unpaid',query=''}={}){
 const needle=String(query).trim().toLocaleLowerCase('vi-VN');
 return [...bookings].filter(b=>filter==='paid'?b.paymentStatus==='Đã thanh toán':filter==='unpaid'?canCollect(b):true)
  .filter(b=>[b.code,b.ownerName,b.petName,b.service].some(value=>String(value??'').toLocaleLowerCase('vi-VN').includes(needle)))
  .sort((a,b)=>`${b.date||''} ${b.slot||''}`.localeCompare(`${a.date||''} ${a.slot||''}`));
}
export function ledgerSummary(bookings){
 const pending=bookings.filter(canCollect);
 return {count:pending.length,amount:pending.reduce((s,b)=>s+Math.max(0,Number(b.total)||0),0)};
}

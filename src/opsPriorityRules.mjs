/** Pure operational prioritization: read-only; never changes booking status or payment. */
export function getOperationsPriorities(bookings, today) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return [];
 const results=[];
 for (const b of bookings) {
  if (!b || !b.code || ['Đã hủy','Không đến'].includes(b.status)) continue;
  const day=String(b.date||'');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
  // One operational card per booking: resolve the most urgent blocker first.
  if (day<today && ['Đang chờ xác nhận','Đã xác nhận'].includes(b.status)) {
   results.push({code:b.code,date:day,slot:b.slot||'',kind:'overdue',rank:0,title:'Lịch quá hạn cần kiểm tra',detail:'Kiểm tra thực tế trước khi quyết định đổi hoặc hủy lịch.',target:'booking'});
  } else if (b.status==='Đang chờ xác nhận') {
   results.push({code:b.code,date:day,slot:b.slot||'',kind:'pending',rank:1,title:'Chờ xác nhận lịch',detail:'Kiểm tra công suất, điều kiện dịch vụ và yêu cầu khách.',target:'booking'});
  } else if (b.status==='Hoàn tất' && b.paymentStatus!=='Đã thanh toán') {
   results.push({code:b.code,date:day,slot:b.slot||'',kind:'finance',rank:3,title:'Hoàn tất nhưng chưa thu tiền',detail:'Chỉ ghi nhận sau khi đối chiếu tiền thực nhận.',target:'finance'});
  }
 }
 return results.sort((a,b)=>a.rank-b.rank||a.date.localeCompare(b.date)||String(a.slot).localeCompare(String(b.slot))||a.code.localeCompare(b.code));
}
export function prioritySummary(rows) {
 return {overdue:rows.filter(x=>x.kind==='overdue').length,pending:rows.filter(x=>x.kind==='pending').length,finance:rows.filter(x=>x.kind==='finance').length};
}

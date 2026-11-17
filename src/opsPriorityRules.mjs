/** Pure operational prioritization: read-only; never changes booking status or payment. */
export function getOperationsPriorities(bookings, today) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return [];
 const results=[];
 for (const b of bookings) {
  if (!b || !b.code || ['Đã hủy','Không đến'].includes(b.status)) continue;
  const day=String(b.date||'');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
  // One operational card per booking: resolve the most urgent blocker first.
  if (b.status==='Đang chờ xác nhận' && day>today) {
   results.push({code:b.code,date:day,slot:b.slot||'',kind:'pending',rank:1,title:'Chờ thanh toán trước',detail:'Lịch tự xác nhận khi đáp ứng điều kiện thanh toán.',target:'booking'});
  } else if ((b.status==='Hoàn tất'||(b.status==='Đang thực hiện'&&b.careCompleted)) && b.paymentStatus!=='Đã thanh toán') {
   results.push({code:b.code,date:day,slot:b.slot||'',kind:'finance',rank:3,title:'Hoàn tất nhưng chưa thu tiền',detail:'Chỉ ghi nhận sau khi đối chiếu tiền thực nhận.',target:'booking'});
  }
 }
 return results.sort((a,b)=>a.rank-b.rank||a.date.localeCompare(b.date)||String(a.slot).localeCompare(String(b.slot))||a.code.localeCompare(b.code));
}
export function prioritySummary(rows) {
 return {overdue:rows.filter(x=>x.kind==='overdue').length,pending:rows.filter(x=>x.kind==='pending').length,finance:rows.filter(x=>x.kind==='finance').length};
}

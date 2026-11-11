/** Read-only closing / handover checklist. No automatic financial or booking mutations. */
export function handoverItems(bookings, asOf) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return [];
 const result=[];
 for(const b of bookings||[]) {
  if(!b?.code || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.date||''))) continue;
  const day=String(b.date),status=b.status,paid=b.paymentStatus==='Đã thanh toán';
  const entry=(kind,priority,label,next)=>result.push({key:`${b.code}:${kind}`,code:b.code,date:day,slot:b.slot||'',petName:b.petName||'',branch:b.branch||'',kind,priority,label,next});
  if(status==='Đã hủy') {if(paid)entry('finance-review',0,'Lịch hủy đã thu tiền','Kiểm tra yêu cầu hoàn tiền và nhật ký đối soát; không tự hoàn tiền.');continue;}
  if(status==='Không đến') {if(paid)entry('finance-review',0,'Lịch vắng mặt đã thu tiền','Kiểm tra chính sách và sổ thu; không tự hủy giao dịch.');continue;}
  if(day<asOf && ['Đang chờ xác nhận','Đã xác nhận','Đang thực hiện'].includes(status))entry('overdue',0,'Lịch quá hạn chưa xử lý','Xác minh tình trạng thực tế và ghi nhận quyết định phù hợp.');
  if(day<=asOf && status==='Đang chờ xác nhận')entry('approval',1,'Chưa xác nhận lịch','Kiểm tra điều kiện dịch vụ và liên hệ khách.');
  if(status==='Hoàn tất' && !paid)entry('payment',3,'Hoàn tất nhưng chưa thu tiền','Đối soát khoản đã nhận trước khi xác nhận thu.');
 }
 return result.sort((a,b)=>a.priority-b.priority||a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot)||a.code.localeCompare(b.code)||a.kind.localeCompare(b.kind));
}
export function handoverCounts(rows){return {total:rows.length,urgent:rows.filter(x=>x.priority===0).length,approval:rows.filter(x=>x.kind==='approval').length,finance:rows.filter(x=>['payment','finance-review'].includes(x.kind)).length};}

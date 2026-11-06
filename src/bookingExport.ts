/** Safe and minimal operational CSV export: no private contact fields or tokens. */
export type BookingExportRow = {code:string;date:string;slot:string;service:string;branch:string;status:string;paymentStatus:string;paymentMethod?:string;total:number;petName:string;assignedStaff?:string};
const HEADERS = ['Mã lịch','Ngày','Giờ','Thú cưng','Dịch vụ','Chi nhánh','Trạng thái','Thanh toán','Phương thức','Tổng tiền (VND)','Nhân viên'];
/** Prefix spreadsheet formula markers even when preceded by Unicode whitespace. */
export function safeCsvCell(value:unknown):string {
 const raw=String(value??'');
 const valueNoControl=raw.replace(/[\u0000-\u001F\u007F]/g,' ');
 const guarded=/^[\s\uFEFF\u200B]*[=+@-]/u.test(valueNoControl)?"'"+valueNoControl:valueNoControl;
 return '"'+guarded.replace(/"/g,'""')+'"';
}
export function bookingsCsv(rows:BookingExportRow[]):string {
 const lines=[HEADERS.map(safeCsvCell).join(',')];
 for(const r of rows){lines.push([r.code,r.date,r.slot,r.petName,r.service,r.branch,r.status,r.paymentStatus,r.paymentMethod==='bank_transfer'?'Chuyển khoản':'Tiền mặt',Math.round(Number(r.total)||0),r.assignedStaff||'Chưa phân công'].map(safeCsvCell).join(','));}
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
export function exportBookingsCsv(rows:BookingExportRow[]):void {
 const blob=new Blob([bookingsCsv(rows)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=`PetDay_LichHen_${new Date().toISOString().slice(0,10)}.csv`;
 document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}

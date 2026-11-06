import {useMemo,useState} from 'react';
import {handoverItems,handoverCounts} from './shiftHandoverRules.mjs';
import {safeCsvCell} from './bookingExport';
type Booking={code:string;date:string;slot:string;status:string;paymentStatus:string;petName:string;branch:string;assignedStaff?:string;assignedStaffId?:number};
type Props={bookings:Booking[];onOpenBooking:(code:string)=>void;onOpenFinance:()=>void};
const dateLocal=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
function saveReport(rows:ReturnType<typeof handoverItems>,date:string){
 const labels=['Mã lịch','Ngày','Giờ','Thú cưng','Chi nhánh','Vấn đề','Bước xử lý'];
 const data=[labels,...rows.map(r=>[r.code,r.date,r.slot,r.petName,r.branch,r.label,r.next])];
 const csv='\uFEFF'+data.map(line=>line.map(safeCsvCell).join(',')).join('\r\n')+'\r\n';
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`PetDay_BanGiaoCa_${date}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
export default function ShiftHandover({bookings,onOpenBooking,onOpenFinance}:Props){
 const [date,setDate]=useState(dateLocal);
 const [expanded,setExpanded]=useState(false);
 const rows=useMemo(()=>handoverItems(bookings,date),[bookings,date]);
 const counts=useMemo(()=>handoverCounts(rows),[rows]);
 return <section className="petday-handover rounded-3xl border border-[#DFE8F4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="handover-heading">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#D96551]">BÀN GIAO CA</p><h2 id="handover-heading" className="mt-1 text-xl font-extrabold text-[#142B55]">Những việc cần bàn giao</h2><p className="mt-1 max-w-xl text-sm text-slate-600">Tổng hợp từ lịch đang có, để ca sau không bỏ sót. Không tự thay đổi lịch hoặc trạng thái thu tiền.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-bold text-[#142B55]">Ngày chốt ca<input type="date" value={date} onChange={e=>{setDate(e.target.value);setExpanded(false)}} className="mt-1 block rounded-xl border border-[#D7E4F4] px-3 py-2.5 text-sm"/></label><button type="button" onClick={()=>saveReport(rows,date)} disabled={!rows.length} className="rounded-xl border border-[#D2DEEE] bg-white px-4 py-2.5 text-sm font-bold text-[#142B55] hover:border-[#FF765E] disabled:opacity-40">Xuất phiếu CSV</button></div></div>
  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:'Tổng việc',value:counts.total},{label:'Cần xác minh gấp',value:counts.urgent},{label:'Chờ xác nhận',value:counts.approval},{label:'Cần đối soát',value:counts.finance}].map(x=><div className="rounded-2xl bg-[#F2F7FD] p-3" key={x.label}><strong className="text-xl text-[#142B55]">{x.value}</strong><p className="text-xs text-slate-600">{x.label}</p></div>)}</div>
  {rows.length?<div className="mt-4 space-y-2">{(expanded?rows:rows.slice(0,4)).map(r=><article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E3EAF4] p-3 sm:p-4" key={r.key}><div className="min-w-0 flex-1"><p className="font-bold text-[#142B55]">{r.label} <span className="font-medium text-slate-500">· {r.code}</span></p><p className="mt-1 text-xs text-slate-600">{r.petName} · {r.date} {r.slot} · {r.branch}</p><p className="mt-1 text-xs text-slate-500">{r.next}</p></div><button type="button" onClick={()=>r.kind==='payment'||r.kind==='finance-review'?onOpenFinance():onOpenBooking(r.code)} className="rounded-xl bg-[#142B55] px-3 py-2 text-xs font-bold text-white hover:bg-[#284978]">Mở xử lý</button></article>)}{rows.length>4&&<button type="button" onClick={()=>setExpanded(x=>!x)} className="rounded-xl px-3 py-2 text-sm font-bold text-[#142B55] hover:bg-[#EEF4FC]">{expanded?'Thu gọn':`Xem tất cả ${rows.length} việc`}</button>}</div>:<p className="mt-4 rounded-2xl border border-dashed border-[#D8E5F3] bg-[#FAFCFF] p-5 text-center text-sm text-slate-600">Không có việc tồn đọng theo các quy tắc bàn giao đang áp dụng.</p>}
  <p className="mt-4 text-xs leading-relaxed text-slate-500">Phiếu CSV chỉ là báo cáo vận hành được trích từ dữ liệu hiện có, không phải biên bản ký nhận hay chứng từ tài chính.</p>
 </section>;
}

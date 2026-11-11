import {useEffect,useMemo,useState} from 'react';
import {apiFetch} from './apiFetch';
import {filterLedger,ledgerSummary,canCollect} from './financeLedgerRules.mjs';

type FinancialBooking={code:string;date:string;slot:string;petName:string;ownerName?:string;service:string;branch:string;total:number;status:string;paymentStatus:string;paymentMethod?:string};
type Props={bookings:FinancialBooking[];busy:boolean;token:string;searchCode?:string;onRecord:(code:string,method:string,status:'Đã thanh toán'|'Chưa thanh toán',reference:string,note:string)=>Promise<void>|void;onUpdated?:()=>Promise<void>|void};
const currency=(n:number)=>Number(n||0).toLocaleString('vi-VN')+'đ';
export default function FinanceWorkbench({bookings,busy,token,searchCode,onRecord,onUpdated,scope='todo'}:Props & {scope?:'todo'|'history'}){
 const [reported,setReported]=useState<Set<string>>(new Set());
 const [noticeLoading,setNoticeLoading]=useState(true);
 const [noticeError,setNoticeError]=useState('');
 async function loadTransferNotices(){
  setNoticeLoading(true);setNoticeError('');
  try{
   const response=await apiFetch('/api/admin/transfer-notices',{headers:{Authorization:'Bearer '+token}});
   if(!response.ok)throw new Error('Không tải được thông báo chuyển khoản của khách.');
   const rows=await response.json() as {code:string}[];
   setReported(new Set(rows.map(row=>row.code)));
  }catch(e){setReported(new Set());setNoticeError((e as Error).message);}
  finally{setNoticeLoading(false);}
 }
 useEffect(()=>{void loadTransferNotices();},[token]);
 const [query,setQuery]=useState('');
 useEffect(()=>{if(searchCode){setQuery(searchCode);setFilter('unpaid');}},[searchCode]);
 const [filter,setFilter]=useState<'unpaid'|'paid'|'all'>(scope==='history'?'paid':'unpaid');
 useEffect(()=>{setFilter(scope==='history'?'paid':'unpaid');},[scope]);
 const [refs,setRefs]=useState<Record<string,string>>({});
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [warning,setWarning]=useState('');
 const [working,setWorking]=useState<string|null>(null);
 const [page,setPage]=useState(1);
 const pageSize=8;
 useEffect(()=>{setPage(1);},[query,filter]);
 const rows=useMemo(()=>filterLedger(bookings,{filter:scope==='history'?'paid':scope==='todo'?'unpaid':filter,query}),[bookings,filter,query,scope]);
 const summary=useMemo(()=>ledgerSummary(bookings),[bookings]);
 const pages=Math.max(1,Math.ceil(rows.length/pageSize));
 const visible=rows.slice((Math.min(page,pages)-1)*pageSize,Math.min(page,pages)*pageSize);
 async function save(b:FinancialBooking){
  const ref=(refs[b.code]||'').trim();const note=(notes[b.code]||'').trim();
  if(!canCollect(b)){setWarning('Lịch đã hủy hoặc đã thu tiền không thể xác nhận thu thêm từ sổ này.');return;}
  if(b.paymentMethod==='bank_transfer'&&(noticeLoading||noticeError||!reported.has(b.code))){setWarning('Chưa có thông báo “Tôi đã chuyển khoản” hợp lệ từ khách. Vui lòng chờ khách thao tác trước khi đối soát.');return;}
  if(b.paymentMethod==='bank_transfer'&&!ref){setWarning('Chuyển khoản cần mã giao dịch đã đối soát trước khi xác nhận.');return;}
  // Taxi waivers change cash due. Never confirm the original invoice blindly.
  const settlementRes=await apiFetch('/api/admin/bookings/'+encodeURIComponent(b.code)+'/settlement',{headers:{Authorization:'Bearer '+token}});
  const settlement=await settlementRes.json().catch(()=>({}));
  if(!settlementRes.ok){setWarning(settlement.error||'Chưa đối soát được số còn phải thu.');return;}
  if(settlement.needsCancellationReview){setWarning('Lịch đã hủy: cần đối soát chính sách hủy dịch vụ trước khi ghi thu.');return;}
  if(settlement.outstanding<=0){setWarning('Lịch không còn khoản phải thu; kiểm tra hồ sơ hoàn và trạng thái tiền.');return;}
  if(!window.confirm(`Xác nhận đã nhận ${currency(settlement.outstanding)} cho lịch ${b.code}? Đây là số còn phải thu sau điều chỉnh phí Taxi.`))return;
  setWarning('');setWorking(b.code);
  try{
   const r=await apiFetch('/api/admin/bookings/'+encodeURIComponent(b.code)+'/receipts',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({amount:settlement.outstanding,reference:ref,note})});
   const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Không ghi được thực thu.');
   setRefs(v=>({...v,[b.code]:''}));setNotes(v=>({...v,[b.code]:''}));
   await onUpdated?.();
  }
  catch(e){setWarning(e instanceof Error?e.message:'Không thể ghi nhận thanh toán.');}
  finally{setWorking(null)}
 }
 return <section id="admin-finance-workbench" className="petday-finance-workbench scroll-mt-32 rounded-3xl border border-[#E2EAF7] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="finance-workbench-heading">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-[#E16E58]">VẬN HÀNH TÀI CHÍNH</p><h2 id="finance-workbench-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-[#142B55]">Sổ thu tiền</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Xác nhận tiền thực nhận theo từng lịch. Việc hoàn tất dịch vụ và việc đã thu tiền là hai trạng thái độc lập.</p></div><div className="rounded-2xl border border-[#DAE8F7] bg-[#F5F9FF] px-5 py-4"><span className="block text-xs font-bold text-slate-500">{scope==='history'?'Đã ghi nhận thanh toán':'Cần kiểm tra khoản thu'}</span><strong className="mt-1 block text-xl text-[#142B55]">{scope==='history'?rows.length:summary.count} lịch</strong>{scope==='todo'&&<span className="block text-xs text-slate-600">Tổng giá trị lịch cần đối soát: {currency(summary.amount)}</span>}</div></div>
  <div className="mt-5 rounded-2xl bg-[#F5F8FD] p-4">
   <label className="text-xs font-bold text-[#142B55]">Tìm mã lịch, khách hoặc thú cưng<input type="search" className="mt-2 w-full rounded-xl border border-[#D5E2F0] bg-white px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-[#FF765E]" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ví dụ: PD-001"/></label>

  </div>
  {noticeError&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{noticeError}</p>}
  <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Cập nhật thông báo chuyển khoản thủ công</summary><button type="button" onClick={()=>void loadTransferNotices()} disabled={noticeLoading} className="mt-2 rounded-xl border border-[#C9D9EB] px-3 py-2 text-xs font-bold text-[#142B55]">{noticeLoading?'Đang kiểm tra...':'Làm mới thông báo'}</button></details>
  {warning&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{warning}</p>}
  <div className="mt-5 grid gap-3 xl:grid-cols-2">{rows.length===0?<div className="lg:col-span-2 rounded-2xl border border-dashed border-[#CEDBED] bg-[#FAFCFF] p-8 text-center"><p className="font-bold text-[#142B55]">Không có lịch phù hợp</p><p className="mt-1 text-sm text-slate-500">Thử thay từ khóa hoặc bộ lọc.</p></div>:visible.map(b=><article key={b.code} className="rounded-2xl border border-[#E2EAF7] p-5 shadow-[0_6px_18px_rgba(20,43,85,.04)]"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-[#142B55]">{b.code}</strong><p className="mt-1 text-sm text-slate-600">{b.petName} · {b.service}</p></div><span className={'rounded-full px-3 py-1 text-xs font-bold '+(b.paymentStatus==='Đã thanh toán'?'bg-[#E7F6EF] text-[#146D55]':'bg-[#FFF0D9] text-[#935A13]')}>{b.paymentStatus}</span></div><p className="mt-2 text-xs text-slate-500">{b.ownerName||'Khách hàng'} · {b.branch} · {b.date} {b.slot}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF0F8] pt-3"><div><span className="block text-[11px] text-slate-500">Giá lịch ban đầu</span><strong className="text-lg text-[#142B55]">{currency(b.total)}</strong></div><span className="text-xs font-semibold text-slate-500">{b.paymentMethod==='bank_transfer'?'Chuyển khoản ngân hàng':'Tiền mặt tại cơ sở'}</span></div>{canCollect(b)&&<div className="mt-4 space-y-3">{b.paymentMethod==='bank_transfer'&&!reported.has(b.code)&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{noticeLoading?'Đang kiểm tra thông báo chuyển khoản...':'Khách chưa báo đã chuyển khoản. Chưa thể xác nhận thu tiền; khách cần mở QR và bấm “Tôi đã chuyển khoản”.'}</p>}<label className="block text-xs font-bold text-[#142B55]">{b.paymentMethod==='bank_transfer'?'Mã giao dịch ngân hàng (bắt buộc)':'Mã biên nhận (nếu có)'}<input value={refs[b.code]||''} maxLength={120} onChange={e=>setRefs(s=>({...s,[b.code]:e.target.value}))} className="mt-1 w-full rounded-xl border border-[#D5E2F0] px-3 py-2.5 text-sm" placeholder="Nhập mã đã đối soát"/></label><label className="block text-xs font-bold text-[#142B55]">Ghi chú đối soát<input value={notes[b.code]||''} maxLength={300} onChange={e=>setNotes(s=>({...s,[b.code]:e.target.value}))} className="mt-1 w-full rounded-xl border border-[#D5E2F0] px-3 py-2.5 text-sm" placeholder="Thông tin đối chiếu (nếu có)"/></label><button type="button" className="w-full rounded-xl bg-[#142B55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#203C70] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy||working!==null||(b.paymentMethod==='bank_transfer'&&(noticeLoading||!!noticeError||!reported.has(b.code)))} onClick={()=>save(b)}>{working===b.code?'Đang ghi nhận...':'Kiểm tra số còn thu & xác nhận'}</button></div>}</article>)}</div>
  {rows.length>pageSize&&<nav aria-label="Phân trang sổ thu tiền" className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-[#E2EAF7] bg-[#F5F8FD] px-4 py-3"><span className="text-xs font-semibold text-slate-600">{rows.length} lịch · Trang {Math.min(page,pages)}/{pages}</span><div className="flex gap-2"><button type="button" disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))} className="rounded-xl border bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">Trước</button><button type="button" disabled={page>=pages} onClick={()=>setPage(v=>Math.min(pages,v+1))} className="rounded-xl border bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">Tiếp</button></div></nav>}
  <p className="mt-5 text-xs leading-relaxed text-slate-500">Sổ này chỉ ghi nhận thao tác xác nhận thủ công sau khi nhân viên kiểm tra tiền thực nhận; chưa kết nối tự động với ngân hàng. Những thay đổi được lưu vào nhật ký đối soát của backend.</p>
 </section>;
}

import {useEffect,useState} from 'react';
import {apiFetch} from './apiFetch';

type RefundRow={legId:number;leg:'pickup'|'return';fee:number;state:string;refundDue:number;issueNote?:string;code:string;total:number;paymentStatus:string;customerName:string;refundId?:number;refundAmount?:number;refundStatus?:string;adminNote?:string;refundReference?:string;createdAt?:string;completedAt?:string};
const money=(amount:number)=>Number(amount||0).toLocaleString('vi-VN')+'đ';
const stateLabels:Record<string,string>={pending:'Chờ duyệt',approved:'Đã duyệt · Chờ hoàn',completed:'Đã ghi nhận hoàn',rejected:'Không hoàn'};
const button='rounded-xl border border-[#BECFE4] px-3.5 py-2 text-sm font-bold text-[#142B55] disabled:opacity-40';
async function api(path:string,token:string,method='GET',body?:object){const res=await apiFetch('/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);return data;}
export function TaxiRefundCenter({token,scope='todo'}:{token:string;scope?:'todo'|'history'}){
 const [rows,setRows]=useState<RefundRow[]>([]),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
 const [notes,setNotes]=useState<Record<number,string>>({}),[refs,setRefs]=useState<Record<number,string>>({}),[query,setQuery]=useState('');
 async function refresh(){try{const data=await api('/admin/taxi-refunds',token);setRows(data);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{void refresh()},[token]);
 async function act(r:RefundRow,decision:'create'|'approve'|'reject'|'complete'){
  if(busy)return;setError('');setSuccess('');
  const key=r.refundId||r.legId,note=(notes[key]||'').trim(),reference=(refs[key]||'').trim();
  if(decision==='reject'&&note.length<8){setError('Cần nhập lý do từ chối ít nhất 8 ký tự.');return;}
  if(decision==='complete'&&reference.length<4){setError('Chỉ xác nhận đã hoàn sau khi nhập mã đối soát (ít nhất 4 ký tự).');return;}
  if(decision==='complete'&&!window.confirm('Xác nhận đã hoàn tiền thực tế hoặc đã hoàn tất trong chế độ mô phỏng? Không có chuyển tiền ngân hàng tự động.'))return;
  try{setBusy(true);
   await api(decision==='create'?'/admin/taxi-refunds/'+r.legId:'/admin/taxi-refunds/'+r.refundId,token,decision==='create'?'POST':'PATCH',decision==='create'?undefined:{decision,note,...(decision==='complete'?{reference}:{})});
   setSuccess(decision==='create'?'Đã tạo hồ sơ chờ duyệt.':decision==='approve'?'Đã duyệt; chưa hoàn tiền.':decision==='complete'?'Đã ghi nhận tiền hoàn và mã đối soát.':'Đã lưu lý do không hoàn.');await refresh();
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const visible=rows.filter(x=>(scope==='history'?['completed','rejected'].includes(x.refundStatus||''):Boolean(x.refundId&&['pending','approved'].includes(x.refundStatus||''))||Boolean(!x.refundId&&x.refundDue>0&&x.paymentStatus==='Đã thanh toán'))).filter(x=>(x.code+' '+x.customerName+' '+x.leg).toLowerCase().includes(query.toLowerCase()));
 const pending=rows.filter(x=>x.refundStatus==='pending'||x.refundStatus==='approved').length;
 return <section className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-7" aria-label="Hoàn tiền Pet Taxi theo từng chiều">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#E16E58]">TÀI CHÍNH · PET TAXI</p><h2 className="mt-1 text-xl font-extrabold text-[#142B55]">Hoàn phí Taxi theo từng chiều</h2><p className="mt-1 text-sm text-slate-600">Một chiều Taxi = một hồ sơ. Tạo hồ sơ → Duyệt → Xác nhận đã hoàn. Không tự chuyển tiền.</p></div><button className={button} disabled={busy} onClick={refresh}>Làm mới</button></div>
  <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#EDF4FC] px-3 py-1 text-xs font-bold text-[#142B55]">{pending} hồ sơ đang xử lý</span><span className="rounded-full bg-[#EDF4FC] px-3 py-1 text-xs font-bold text-[#142B55]">{rows.filter(x=>x.refundDue>0&&!x.refundId&&x.paymentStatus==='Đã thanh toán').length} chiều cần lập hồ sơ</span></div>
  <label className="mt-4 block text-sm font-bold text-[#142B55]">Tìm mã lịch hoặc khách hàng<input className="mt-1 w-full rounded-xl border border-[#CFDDEF] p-3 text-sm" placeholder="Ví dụ PD-..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
  {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{success&&<p role="status" className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-[#142B55]">{success}</p>}
  <div className="mt-4 grid gap-3 lg:grid-cols-2">{visible.map(r=>{const key=r.refundId||r.legId;return <article key={r.legId} className="space-y-3 rounded-2xl border border-[#E0E8F4] bg-[#FBFCFF] p-4"><div className="flex flex-wrap justify-between gap-2"><div><strong className="text-[#142B55]">{r.code} · {r.leg==='pickup'?'Chiều đón':'Chiều về'}</strong><p className="mt-1 text-xs text-slate-600">{r.customerName}</p></div><span className="self-start rounded-full bg-[#E9F1FB] px-3 py-1 text-xs font-bold text-[#142B55]">{r.refundStatus?stateLabels[r.refundStatus]||r.refundStatus:'Chưa lập hồ sơ'}</span></div>
   <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3"><div><p className="text-xs text-slate-500">Phí chiều Taxi</p><strong>{money(r.fee)}</strong></div><div><p className="text-xs text-slate-500">{r.paymentStatus==='Đã thanh toán'?'Hoàn dự kiến':'Phí được miễn / giảm'}</p><strong className="text-[#142B55]">{money(r.refundAmount??r.refundDue)}</strong></div></div>
   <p className="text-xs text-slate-600">Thanh toán lịch: {r.paymentStatus} · Tổng đã ghi trên lịch: {money(r.total)}</p>{r.issueNote&&<p className="rounded-lg bg-[#F2F6FC] p-2 text-xs">Nguyên nhân: {r.issueNote}</p>}
   {r.refundStatus==='approved'&&<label className="block text-xs font-bold">Mã đối soát hoàn tiền<input className="mt-1 w-full rounded-lg border p-2 text-sm" value={refs[key]||''} onChange={e=>setRefs(p=>({...p,[key]:e.target.value}))} placeholder="Nhập sau khi hoàn tiền"/></label>}
   {['pending','approved'].includes(r.refundStatus||'')&&<label className="block text-xs font-bold">Ghi chú Admin<textarea className="mt-1 w-full rounded-lg border p-2 text-sm" rows={2} value={notes[key]||''} onChange={e=>setNotes(p=>({...p,[key]:e.target.value}))}/></label>}
   <div className="flex flex-wrap gap-2">{!r.refundId&&<button className={button} disabled={busy||r.paymentStatus!=='Đã thanh toán'} onClick={()=>act(r,'create')}>1. Tạo hồ sơ hoàn</button>}{r.refundStatus==='pending'&&<><button className="rounded-xl bg-[#142B55] px-4 py-2 text-sm font-bold text-white disabled:opacity-40" disabled={busy} onClick={()=>act(r,'approve')}>2. Duyệt hoàn</button><button className={button} disabled={busy} onClick={()=>act(r,'reject')}>Không hoàn</button></>}{r.refundStatus==='approved'&&<button className="rounded-xl bg-[#142B55] px-4 py-2 text-sm font-bold text-white disabled:opacity-40" disabled={busy} onClick={()=>act(r,'complete')}>3. Xác nhận đã hoàn</button>}</div>
   {r.paymentStatus!=='Đã thanh toán'&&!r.refundId&&<p className="text-xs text-amber-900">Lịch chưa ghi nhận đã thu: không tạo khoản hoàn tiền; xử lý miễn/giảm phí tại đối soát.</p>}
   {r.refundReference&&<p className="text-xs">Mã hoàn: {r.refundReference}</p>}
  </article>})}{!visible.length&&<p className="rounded-xl bg-[#F2F7FC] p-4 text-sm text-slate-500">Không có chiều Taxi cần xử lý.</p>}</div>
  <p className="mt-4 text-xs leading-5 text-slate-500">Nếu đã có hồ sơ hoàn dịch vụ chiếm toàn bộ tiền thu, hệ thống sẽ chặn tạo thêm hồ sơ hoàn Taxi để tránh hoàn trùng. Admin phải đối soát lại khoản dịch vụ trước. “Đã hoàn” là ghi nhận thủ công, không phải giao dịch ngân hàng tự động.</p>
 </section>;
}
export function CustomerTaxiRefunds({token}:{token:string}){
 const [rows,setRows]=useState<RefundRow[]>([]),[error,setError]=useState('');
 async function refresh(){try{setRows(await api('/my/taxi-refunds',token));setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{void refresh()},[token]);
 return <section className="mt-5 rounded-2xl border border-[#DDE9F8] bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-extrabold text-[#142B55]">Hoàn phí Pet Taxi</h3><p className="mt-1 text-xs text-slate-600">Theo dõi riêng phí chiều đón và chiều về.</p></div><button className={button} onClick={refresh}>Cập nhật</button></div>{error&&<p className="mt-2 text-sm text-rose-800">{error}</p>}
 <div className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(r=><div key={r.code+'-'+r.leg} className="rounded-xl bg-[#F2F7FC] p-3 text-sm"><strong>{r.code} · {r.leg==='pickup'?'Chiều đón':'Chiều về'}</strong><p className="mt-1">{r.paymentStatus==='Đã thanh toán'?'Khoản có thể hoàn':'Phí được miễn / giảm'}: <strong>{money(r.refundAmount??r.refundDue)}</strong></p><p className="mt-1 text-xs text-slate-600">{r.refundStatus?stateLabels[r.refundStatus]||r.refundStatus:r.paymentStatus==='Đã thanh toán'?'Chờ Admin đối soát':'Chưa thu tiền · Không cần chuyển hoàn'}</p>{r.adminNote&&<p className="mt-1 text-xs">Ghi chú: {r.adminNote}</p>}{r.refundReference&&<p className="mt-1 text-xs">Mã đối soát: {r.refundReference}</p>}</div>)}{!rows.length&&<p className="text-sm text-slate-500">Chưa có khoản Taxi cần hoàn.</p>}</div>
 </section>;
}

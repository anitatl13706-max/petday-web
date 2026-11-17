import {useEffect,useMemo,useState} from 'react';
import {apiFetch} from './apiFetch';
import {summariseBookingPayment,PAYMENT_PLAN_LABELS,PAYMENT_STAGE_LABELS} from './paymentAccounting.mjs';

type Row={id:number;code:string;status:string;amount:number;reason?:string;leg?:string;refundStatus?:string;refundAmount?:number;refundDue?:number};
type Booking={code:string;service:string;status:string;total:number;paymentStatus:string;paymentMethod?:string;paymentPlan?:string|null;collectedPaid?:number;bankPaid?:number;cashPaid?:number;depositApplied?:number;depositPaid?:number;latestPaymentAt?:string;createdAt?:string;customerNote?:string;lineItems?:{type?:string;requiredAmount?:number}[]};
type Filter='all'|'awaiting'|'confirmed'|'outstanding'|'paid';
const fmt=(v:number)=>Number(v||0).toLocaleString('vi-VN')+'đ';
const date=(v?:string)=>v?new Date(v).toLocaleString('vi-VN'):'Chưa ghi nhận';
async function request(path:string,token:string,method='GET',body?:object){const r=await apiFetch('/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Không tải được dữ liệu');return d;}

export default function AutoPolicyFinancePanel({token,bookings,category,onUpdated}:{token:string;bookings:Booking[];category:'payments'|'refunds';onUpdated?:()=>Promise<void>|void}){
 const [method,setMethod]=useState<'bank_transfer'|'cash'>('bank_transfer');
 const [scope,setScope]=useState<Filter>('all');
 const [planFilter,setPlanFilter]=useState<'all'|'DEPOSIT_20'|'FULL_PREPAY'|'PAY_LATER'>('all');
 const [query,setQuery]=useState('');
 const [amounts,setAmounts]=useState<Record<string,string>>({});const [refs,setRefs]=useState<Record<string,string>>({});const [notes,setNotes]=useState<Record<string,string>>({});
 const [working,setWorking]=useState('');const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const [service,setService]=useState<Row[]>([]);
 const rows=useMemo(()=>bookings.map(b=>({b,p:summariseBookingPayment(b)})),[bookings]);
 const active=rows.filter(({b})=>!['Đã hủy','Không hoàn thành'].includes(b.status));
 const stats={awaiting:active.filter(({b,p})=>b.status==='Đang chờ xác nhận'||p.stage==='DEPOSIT_PENDING').length,
 confirmed:active.filter(({b})=>['Đã xác nhận','Đang thực hiện','Hoàn tất'].includes(b.status)).length,
 outstanding:active.filter(({p})=>p.remaining>0).length,
 paid:active.filter(({p})=>p.stage==='PAID').length};
 const matches=(b:Booking,p:ReturnType<typeof summariseBookingPayment>)=>{
  const filterMatches=scope==='all'||scope==='awaiting'&&(b.status==='Đang chờ xác nhận'||p.stage==='DEPOSIT_PENDING')||scope==='confirmed'&&['Đã xác nhận','Đang thực hiện','Hoàn tất'].includes(b.status)||scope==='outstanding'&&p.remaining>0||scope==='paid'&&p.stage==='PAID';
  // Filter by receipt source too, so mixed payments remain visible in both tabs.
  const methodMatches=method==='bank_transfer'?(b.paymentMethod==='bank_transfer'||p.bank>0):(b.paymentMethod==='cash'||p.cash>0||p.remaining>0);
  return filterMatches&&methodMatches&&(planFilter==='all'||p.plan===planFilter)&&[b.code,b.service,b.customerNote].join(' ').toLowerCase().includes(query.trim().toLowerCase());
 };
 const visible=rows.filter(({b,p})=>b.status!=='Không hoàn thành'&&matches(b,p));
 async function recordCash(b:Booking,remaining:number){
  const amount=Number(amounts[b.code]||remaining),reference=(refs[b.code]||'').trim();
  if(!Number.isSafeInteger(amount)||amount<=0||amount>remaining){setError('Số tiền mặt phải lớn hơn 0 và không vượt khoản còn phải thu.');return;}
  if(reference.length<4){setError('Nhập mã biên nhận tối thiểu 4 ký tự.');return;}
  if(!window.confirm(`Đã thực nhận ${fmt(amount)} tiền mặt cho ${b.code}?`))return;
  setWorking(b.code);setError('');setSuccess('');
  try{await request('/admin/bookings/'+encodeURIComponent(b.code)+'/receipts',token,'POST',{amount,reference,method:'cash',note:(notes[b.code]||'').trim()});setSuccess('Đã ghi nhận tiền mặt cho '+b.code);await onUpdated?.();}
  catch(e){setError((e as Error).message)}finally{setWorking('')}
 }
 async function refreshRefunds(){setError('');try{const a=await request('/admin/refunds',token);setService(a)}catch(e){setError((e as Error).message)}}
 useEffect(()=>{if(category==='refunds')void refreshRefunds()},[token,category]);
 const tab=(active:boolean)=>'rounded-xl px-4 py-2 text-sm font-semibold '+(active?'bg-[#142B55] text-white':'border border-[#D9E4F3] bg-white text-[#142B55]');
 return <section className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-[#E16E58]">QUẢN LÝ THU CHI</p><h2 className="mt-1 text-xl font-extrabold text-[#142B55]">{category==='payments'?'Quản lý thanh toán dịch vụ':'Theo dõi hoàn phí'}</h2><p className="mt-2 text-sm text-slate-600">{category==='payments'?'Theo dõi phương án thanh toán, tiền cọc, các khoản đã thu và công nợ theo từng lịch.':'Theo dõi khoản hoàn của lịch hẹn và cửa hàng.'}</p></div><button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={()=>{void onUpdated?.();if(category==='refunds')void refreshRefunds()}}>Làm mới</button></div>
  {error&&<p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{success&&<p role="status" className="mt-3 rounded-xl bg-[#E7F6EE] p-3 text-sm text-[#166141]">{success}</p>}
  {category==='payments'?<>
   <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{([
    ['awaiting','Chờ thanh toán ban đầu',stats.awaiting],['confirmed','Lịch đã xác nhận',stats.confirmed],['outstanding','Còn công nợ',stats.outstanding],['paid','Đã thanh toán đủ',stats.paid]
   ] as [Filter,string,number][]).map(([key,label,value])=><button type="button" key={key} onClick={()=>setScope(scope===key?'all':key)} aria-pressed={scope===key} className={'rounded-2xl border p-4 text-left '+(scope===key?'border-[#142B55] bg-[#EDF4FC]':'border-[#DDE9F8] bg-[#FAFCFF]')}><span className="block text-xs text-slate-500">{label}</span><strong className="mt-2 block text-2xl text-[#142B55]">{value}</strong></button>)}</div>
   <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Kênh thu tiền"><button type="button" className={tab(method==='bank_transfer')} aria-pressed={method==='bank_transfer'} onClick={()=>setMethod('bank_transfer')}>Chuyển khoản</button><button type="button" className={tab(method==='cash')} aria-pressed={method==='cash'} onClick={()=>setMethod('cash')}>Thu tiền mặt</button></div>
   <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#142B55]">Phương án thanh toán<select value={planFilter} onChange={e=>setPlanFilter(e.target.value as typeof planFilter)} className="mt-1 w-full rounded-xl border border-[#DDE9F8] bg-white px-3 py-2.5 text-sm"><option value="all">Tất cả phương án</option><option value="DEPOSIT_20">Bắt buộc trả trước · Cọc 20%</option><option value="FULL_PREPAY">Thanh toán trước toàn bộ</option><option value="PAY_LATER">Thanh toán khi sử dụng dịch vụ</option></select></label><label className="text-xs font-semibold text-[#142B55]">Tìm lịch hoặc dịch vụ<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Mã lịch, dịch vụ, ghi chú..." className="mt-1 w-full rounded-xl border border-[#DDE9F8] px-3 py-2.5 text-sm"/></label></div>
   <p className="mt-4 text-xs text-slate-500">Tiền cọc là một phần của tổng đã thu, không cộng hai lần. Giao dịch lịch sử chưa xác định mục đích sẽ không tự gán thành tiền cọc.</p>
   <div className="mt-4 space-y-3">{visible.map(({b,p})=><article key={b.code} className="rounded-2xl border border-[#DEE9F6] p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-[#142B55]">{b.code}</strong><p className="mt-1 text-sm text-slate-600">{b.service} · {date(b.createdAt)}</p></div><span className="rounded-full bg-[#EDF4FC] px-3 py-1 text-xs font-bold text-[#142B55]">{PAYMENT_STAGE_LABELS[p.stage as keyof typeof PAYMENT_STAGE_LABELS]}</span></div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs"><p><span className="text-slate-500">Lịch: </span><strong>{b.status==='Đang chờ xác nhận'?'Chờ thanh toán ban đầu':b.status}</strong></p><p><span className="text-slate-500">Phương án: </span><strong>{p.plan?PAYMENT_PLAN_LABELS[p.plan as keyof typeof PAYMENT_PLAN_LABELS]:'Chưa xác định từ dữ liệu cũ'}</strong></p></div>
    <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#F4F8FE] p-3 text-sm sm:grid-cols-3">{([
     ['Tổng giá trị',p.total],['Cọc 20% yêu cầu',p.required],['Đã phân bổ vào cọc',p.depositApplied],['Đã chuyển khoản',p.bank],['Đã thu tiền mặt',p.cash],['Còn phải thanh toán',p.remaining]
    ] as [string,number][]).map(([label,value])=><div key={label}><span className="block text-xs text-slate-500">{label}</span><strong className="text-[#142B55]">{fmt(value)}</strong></div>)}</div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Tổng đã thu: <strong>{fmt(p.collected)}</strong> · Thu gần nhất: {date(b.latestPaymentAt)}</p><details className="min-w-[175px] rounded-lg border border-[#DAE6F5] px-3 py-2 text-xs"><summary className="cursor-pointer font-bold text-[#142B55]">Chi tiết & thao tác</summary><div className="mt-3 space-y-2"><p>{b.customerNote?'Ghi chú: '+b.customerNote:'Không có ghi chú khách hàng'}</p>{p.required>0&&<p>Mức cọc ban đầu: {fmt(p.required)} · Đã phân bổ: {fmt(p.depositApplied)}.</p>}{method==='cash'&&b.status!=='Đã hủy'&&p.remaining>0&&<div className="space-y-2"><label className="block">Tiền mặt thực nhận<input type="number" min="1" max={p.remaining} value={amounts[b.code]??String(p.remaining)} onChange={e=>setAmounts(a=>({...a,[b.code]:e.target.value}))} className="mt-1 w-full rounded-lg border p-2"/></label><label className="block">Mã biên nhận<input value={refs[b.code]||''} onChange={e=>setRefs(a=>({...a,[b.code]:e.target.value}))} className="mt-1 w-full rounded-lg border p-2" placeholder="CASH-20261114-001"/></label><label className="block">Ghi chú thu tiền<input value={notes[b.code]||''} onChange={e=>setNotes(a=>({...a,[b.code]:e.target.value}))} className="mt-1 w-full rounded-lg border p-2" maxLength={300}/></label><button type="button" disabled={Boolean(working)} className="rounded-lg bg-[#142B55] px-4 py-2 text-white disabled:opacity-50" onClick={()=>recordCash(b,p.remaining)}>Xác nhận đã nhận tiền mặt</button></div>}{method==='bank_transfer'&&<p>Chuyển khoản được ghi nhận từ biên nhận đã xác minh; không có nút Admin duyệt giao dịch QR thông thường.</p>}</div></details></div>
   </article>)}{!visible.length&&<p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">Không có lịch phù hợp bộ lọc.</p>}</div>
  </>:<div className="mt-4 space-y-4"><h3 className="font-bold">Hoàn phí dịch vụ</h3>{service.map(r=><div key={r.id} className="rounded-lg border p-3 text-sm"><strong>{r.code} · {fmt(r.amount)}</strong><p>{r.reason}</p><p>{r.status==='completed'&&!String((r as Row & {refundReference?:string}).refundReference||'').startsWith('TEST-')?'Đã hoàn':r.status==='completed'||r.status==='approved'?'Đã xác định khoản hoàn, chưa chuyển tiền':r.status==='pending'?'Đang xác minh':'Không hoàn'}</p></div>)}{!service.length&&<p className="text-sm text-slate-500">Chưa có khoản hoàn.</p>}</div>}
  <p className="mt-4 text-xs text-slate-500">Số liệu lấy từ PetDay, không thay thế sao kê ngân hàng. Khoản hoàn thực tế chỉ được ghi hoàn tất khi có xác nhận trả tiền hợp lệ.</p>
 </section>;
}

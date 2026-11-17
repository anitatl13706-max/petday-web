import {useState} from 'react';
import {apiFetch} from './apiFetch';
const money=(n:number)=>Number(n||0).toLocaleString('vi-VN')+'đ';
type Leg={leg:string;fee:number;state:string;waived:number;charge:number};
type Summary={code:string;method:string;paymentStatus:string;bookingStatus:string;total:number;collected:number;taxiWaived:number;charge:number;completedRefund:number;reservedRefund:number;outstanding:number;refundCandidate:number;needsCancellationReview:boolean;legs:Leg[]};
export default function BookingSettlementPanel({token}:{token:string}){
 const [code,setCode]=useState(''),[data,setData]=useState<Summary|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){if(!code.trim())return;setBusy(true);setError('');setData(null);try{
  const res=await apiFetch('/api/admin/bookings/'+encodeURIComponent(code.trim().toUpperCase())+'/settlement',{headers:{Authorization:'Bearer '+token}});
  const out=await res.json().catch(()=>({}));if(!res.ok)throw Error(out.error||`HTTP ${res.status}`);setData(out);
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="rounded-3xl border border-[#DCE6F4] bg-white p-5 shadow-sm sm:p-7" aria-label="Đối soát lịch hẹn và tiền thực thu">
  <h2 className="text-xl font-extrabold text-[#142B55]">Đối soát thanh toán lịch hẹn</h2>
  <p className="mt-1 text-sm text-slate-600">Nhập mã lịch để xem phí sau hủy, tiền đã thu và khoản còn phải thu/hoàn. Không tự ghi nhận đã thu hoặc đã hoàn.</p>
  <div className="mt-4 flex flex-wrap gap-2"><input aria-label="Mã lịch cần đối soát" value={code} onChange={e=>setCode(e.target.value)} placeholder="PD-..." className="min-w-0 flex-1 rounded-xl border border-[#CFDDEF] px-4 py-3 text-sm"/><button disabled={busy||!code.trim()} onClick={load} className="rounded-xl bg-[#142B55] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Đang kiểm tra...':'Tra cứu'}</button></div>
  {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
  {data&&<div className="mt-4 space-y-3"><p className="text-sm font-bold text-[#142B55]">{data.code} · {data.method==='cash'?'Tiền mặt tại cơ sở':'Chuyển khoản'} · {data.paymentStatus}</p>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
    ['Phí gốc',data.total],['Đã thực thu',data.collected],['Còn phải thu',data.outstanding]
   ].map(([title,amount])=><div key={String(title)} className="rounded-xl bg-[#F2F7FC] p-3"><p className="text-xs text-slate-600">{title}</p><strong className="mt-1 block text-lg text-[#142B55]">{money(Number(amount))}</strong></div>)}</div>
   {data.legs.length>0&&<div className="space-y-2">{data.legs.map(x=><div key={x.leg} className="flex flex-wrap justify-between gap-3 rounded-xl border px-4 py-3 text-sm"><span className="font-bold">{x.leg==='pickup'?'Chiều đón':'Chiều về'} · {x.state}</span><span>Phí {money(x.fee)}</span></div>)}</div>}
   <p className="rounded-xl bg-[#EEF5FC] p-3 text-sm text-[#142B55]">{data.refundCandidate>0?`Có ${money(data.refundCandidate)} đã thu dư chưa có hồ sơ hoàn. Nhân viên đối soát theo lịch hẹn.`:data.outstanding>0?`Còn phải thu ${money(data.outstanding)}. Chưa được ghi thành tiền hoàn.`:'Không còn số dư phải thu/hoàn chưa xử lý.'} Đã hoàn: {money(data.completedRefund)}; đang giữ chờ hoàn: {money(data.reservedRefund)}.</p>
   {data.needsCancellationReview&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Lịch chăm sóc đã hủy. Số phải chịu phần chăm sóc cần đối soát theo chính sách hủy trước khi ghi thu thêm.</p>}
  </div>}
 </section>;
}

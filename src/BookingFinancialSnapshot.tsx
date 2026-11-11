import {useState} from 'react';
import {apiFetch} from './apiFetch';

type Ledger={
 code:string;method:string;paymentStatus:string;total:number;collected:number;
 taxiWaived:number;charge:number;completedRefund:number;reservedRefund:number;
 outstanding:number;refundCandidate:number;needsCancellationReview:boolean;
 legs:{leg:string;fee:number;waived:number;charge:number;state:string}[];
};
const money=(n:number)=>Number(n||0).toLocaleString('vi-VN')+'đ';
/** Load only on expansion: no additional calls when rendering a whole page of bookings. */
export default function BookingFinancialSnapshot({code,token}:{code:string;token:string}){
 const [data,setData]=useState<Ledger|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 async function load(){if(loading)return;setLoading(true);setError('');try{
  const r=await apiFetch('/api/admin/bookings/'+encodeURIComponent(code)+'/settlement',{headers:{Authorization:'Bearer '+token}});
  const result=await r.json().catch(()=>({}));
  if(!r.ok){
   const schemaIssue=r.status===503&&String(result.error||'').includes('Cấu trúc PostgreSQL');
   throw Error(schemaIssue?'API hóa đơn không đọc được dữ liệu thực tế (HTTP 503). Kết quả /api/health/schema chỉ kiểm tra một số bảng/cột. Hãy gửi lỗi [schema-mismatch] trong Terminal backend để xác định đúng bảng/cột bị thiếu; không chạy lại migration hàng loạt.':result.error||`Không tải được hóa đơn (HTTP ${r.status}).`);
  }
  setData(result as Ledger);
 }catch(e){setError((e as Error).message||'Không đọc được hóa đơn.');}finally{setLoading(false);}}
 return <details className="rounded-xl border border-[#DAE6F5] bg-[#FAFCFF] p-3 text-sm" onToggle={e=>{if(e.currentTarget.open)void load();}}>
  <summary className="cursor-pointer font-bold text-[#142B55]">Hóa đơn & đối soát · mở xem số tiền sau điều chỉnh</summary>
  {loading&&<p className="mt-3 text-slate-500">Đang tính từ biên nhận và phí thực tế...</p>}
  {error&&<p className="mt-3 rounded-lg bg-rose-50 p-2 text-rose-700" role="alert">{error}</p>}
  {data&&<div className="mt-3 space-y-2">
   <p className="text-xs text-slate-600">{data.method==='cash'?'Tiền mặt tại cơ sở':'Chuyển khoản QR'} · {data.paymentStatus}</p>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {([['Hóa đơn gốc',data.total],['Điều chỉnh phí Taxi',-data.taxiWaived],['Phí sau điều chỉnh',data.charge],['Đã thu thực tế',data.collected],['Còn phải thu',data.outstanding],['Đã hoàn',data.completedRefund]] as [string,number][]).map(([label,value])=><div key={label} className="rounded-lg bg-[#EEF4FC] p-3"><p className="text-xs text-slate-500">{label}</p><strong className="text-[#142B55]">{value<0?'−'+money(-value):money(value)}</strong></div>)}
   </div>
   {data.legs.length>0&&<div className="space-y-1">{data.legs.map(leg=><p key={leg.leg} className="text-xs text-slate-600">{leg.leg==='pickup'?'Taxi chiều đón':'Taxi chiều về'}: {money(leg.fee)} · miễn/giảm {money(leg.waived)} · khách chịu {money(leg.charge)}</p>)}</div>}
   {data.needsCancellationReview&&<p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Lịch đã hủy: cần đối soát phần phí chăm sóc theo chính sách trước khi ghi thu thêm.</p>}
   {data.refundCandidate>0?<p className="rounded-lg bg-blue-50 p-2 text-xs text-[#142B55]">Đã thu dư {money(data.refundCandidate)} chưa phân bổ vào hồ sơ hoàn. Vào Tài chính để xử lý; không tự chuyển tiền.</p>:data.outstanding>0?<p className="rounded-lg bg-blue-50 p-2 text-xs text-[#142B55]">Còn phải thu {money(data.outstanding)}. Nếu chưa thanh toán, khoản miễn/giảm Taxi đã được trừ trên hóa đơn, KHÔNG tạo hồ sơ hoàn tiền.</p>:<p className="text-xs text-slate-600">Không có số dư mới cần thu/hoàn. Khoản chờ hoàn đang giữ: {money(data.reservedRefund)}.</p>}
   <button type="button" onClick={()=>void load()} disabled={loading} className="rounded-lg border border-[#B4C9E1] bg-white px-3 py-2 text-xs font-bold text-[#142B55]">Làm mới số tiền</button>
  </div>}
 </details>;
}

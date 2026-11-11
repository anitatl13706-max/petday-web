import {useEffect,useState} from 'react';
import {apiFetch} from './apiFetch';
type Session={expiresAt:string;reportedAt:string|null;qrSvgDataUrl:string;notice:string};
export default function PaymentQrPanel({token,kind,code,amount,onWindowChange}:{token:string;amount?:number;kind:'booking'|'retail';code:string;onWindowChange?:(open:boolean)=>void}){
 const [session,setSession]=useState<Session|null>(null);
 const [now,setNow]=useState(Date.now());
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function issue(){setBusy(true);setError('');try{const response=await apiFetch('/api/payments/qr-session',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({kind,code})});const data=await response.json();if(!response.ok)throw Error(data.error||'Không tạo được mã QR');setSession(data);setNow(Date.now());}catch(e){setError((e as Error).message);setSession(null)}finally{setBusy(false)}}
 useEffect(()=>{issue()},[token,kind,code]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[]);
 const remaining=session?.reportedAt?0:Math.max(0,Math.ceil((new Date(session?.expiresAt||0).getTime()-now)/1000));
 const open=remaining>0&&!session?.reportedAt;
 useEffect(()=>{onWindowChange?.(Boolean(open))},[open,onWindowChange]);
 return <section className="rounded-2xl border border-[#C9D8EA] bg-white p-4" aria-label={'Mã QR tham chiếu '+code}>
  <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-extrabold text-[#142B55]">Quét mã QR · {code}</h4>{typeof amount==='number'&&<strong className="text-lg text-[#142B55]">{amount.toLocaleString('vi-VN')}đ</strong>}</div>
  <p className="mt-1 text-xs text-[#94611F]">Mã QR tham chiếu đơn hàng.</p>
  {error&&<p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
  {session&&<div className="mt-3 flex flex-col items-center gap-2"><img src={session.qrSvgDataUrl} className="h-44 w-44" alt={'QR đơn hàng '+code}/><p className="text-sm font-bold" aria-live="polite">{session.reportedAt?'Đã báo chuyển khoản · Chờ nhân viên xác nhận':remaining>0?'Thời hạn báo chuyển khoản: '+String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'):'Phiên QR đã hết hạn'}</p><p className="text-center text-xs text-slate-500">{'QR dùng để xác nhận trên PetDay, không dùng chuyển tiền ngân hàng thật.'}</p></div>}
  {!session||(!open&&!session.reportedAt)?<button type="button" disabled={busy} onClick={issue} className="mt-3 rounded-lg border border-[#9DB3CD] px-3 py-2 text-sm font-semibold text-[#142B55] disabled:opacity-40">{busy?'Đang tạo mã…':'Tạo / làm mới mã QR 15 phút'}</button>:null}
 </section>;
}

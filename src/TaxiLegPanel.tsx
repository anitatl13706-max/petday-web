import {useEffect,useState} from 'react';
import {apiFetch} from './apiFetch';
type Leg={id:number;leg:'pickup'|'return';fee:number;state:string;scheduledAt?:string;issueNote?:string;customerPlan?:string;refundDue:number};
const labels:Record<string,string>={requested:'Chờ xác nhận',confirmed:'Đã xác nhận',en_route:'Đang thực hiện',arrived:'Đang thực hiện',contacting:'Đang thực hiện',completed:'Hoàn tất',customer_self:'Khách tự đưa pet đến',no_show:'Không thực hiện được · Khách vắng mặt',provider_fault:'Không thực hiện được · Lỗi PetDay',cancelled:'Đã hủy',under_review:'Chờ xác minh'};
const money=(value:number)=>Number(value).toLocaleString('vi-VN')+'đ';
const nextStep:Record<string,string>={requested:'Admin xác nhận giờ điều phối.',confirmed:'Admin bắt đầu chuyến khi xe thực sự xuất phát.',en_route:'Đang vận chuyển: xác nhận bàn giao hoặc ghi nhận sự cố.',arrived:'Đang vận chuyển: xác nhận bàn giao hoặc ghi nhận sự cố.',contacting:'Đang vận chuyển: xác nhận bàn giao hoặc ghi nhận sự cố.',completed:'Đã bàn giao thành công, không phát sinh hoàn phí.',customer_self:'Khách tự đưa pet đến; Admin vẫn cần Check-in.',cancelled:'Chiều này đã hủy. Phí hoàn dự kiến cần Admin đối soát.',provider_fault:'PetDay không thực hiện được chuyến; cần đối soát phí.',no_show:'Taxi không gặp khách; lịch chăm sóc vẫn xử lý riêng.',under_review:'Đang xác minh nguyên nhân, chưa quyết toán tiền.'};
const btn='rounded-xl border border-[#9FB6D4] bg-white px-3 py-2 text-xs font-semibold text-[#142B55] disabled:opacity-40';
export default function TaxiLegPanel({code,token,role,bookingStatus,onUpdated}:{code:string;token:string;role:string;bookingStatus:string;onUpdated?:()=>Promise<void>|void}){
 const [legs,setLegs]=useState<Leg[]>([]);const [events,setEvents]=useState<{legId:number;action:string;at:string;note?:string}[]>([]);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [notes,setNotes]=useState<Record<string,string>>({});const [verified,setVerified]=useState<Record<string,boolean>>({});const [notPicked,setNotPicked]=useState<Record<string,boolean>>({});const [loading,setLoading]=useState(true);
 async function call(path:string,method='GET',data?:object){const resp=await apiFetch('/api'+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(data?{body:JSON.stringify(data)}:{})});const out=await resp.json().catch(()=>({error:'Máy chủ không trả JSON'}));if(!resp.ok)throw Error(out.error||`HTTP ${resp.status}`);return out;}
 async function refresh(){try{setLoading(true);const out=await call('/bookings/'+encodeURIComponent(code)+'/taxi/legs');setLegs(out.legs||[]);setEvents(out.events||[]);setError('');}catch(e:any){setError(e.message||'Không tải được thông tin Taxi.');}finally{setLoading(false);}}
 useEffect(()=>{if(token)void refresh();},[code,token]);
 async function execute(leg:Leg,action:string){
  if(busy)return;const note=(notes[leg.leg]||'').trim();
  if(['no_show','provider_fault','review','cancel_customer_departed'].includes(action)&&note.length<8){setError('Vui lòng ghi rõ lý do (ít nhất 8 ký tự).');return;}
  if(action==='cancel_customer_departed'&&!notPicked[leg.leg]){setError('Cần xác nhận pet chưa được đón trước khi chốt hủy và hoàn 50%.');return;}
  if(action==='no_show'&&!verified[leg.leg]){setError('Hãy xác nhận xe đến đúng điểm đón, đã liên hệ khách và khách vẫn vắng mặt.');return;}
  if(['cancel','self_arrival','cancel_return','no_show','provider_fault','complete','cancel_customer_departed'].includes(action)&&!window.confirm('Xác nhận kết quả chiều Taxi này? Lịch chăm sóc không tự hủy.'))return;
  const data:any={action};
  if(role==='admin'&&action==='no_show')data.verifiedAbsent=true;
  if(role==='admin'&&action==='cancel_customer_departed')data.verifiedNotPicked=true;
  if(note)data.note=note;
  try{setBusy(true);setError('');await call((role==='admin'?'/admin':'')+'/bookings/'+encodeURIComponent(code)+'/taxi/legs/'+leg.leg+(role==='admin'?'/event':'/customer'),'POST',data);await refresh();await onUpdated?.();}catch(e:any){setError(e.message||'Không cập nhật được Taxi.');}finally{setBusy(false);}
 }
 return <section className="mt-3 space-y-3 rounded-xl border border-[#DDE9F6] bg-[#F7FAFF] p-3 text-sm">
  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[#142B55]">Pet Taxi · Điều phối đơn giản</strong><button type="button" className={btn} disabled={busy} onClick={refresh}>Cập nhật</button></div>
  <p className="text-xs text-slate-600">Taxi theo ngày lịch chăm sóc. Admin xác nhận chuyến rồi bắt đầu khi xe thực sự xuất phát; không cần chọn ngày giờ Taxi riêng.</p>
  {loading&&<p className="text-xs text-slate-500">Đang tải...</p>}
  {error&&<p role="alert" className="rounded-lg bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}
  {legs.map(leg=><details key={leg.id} defaultOpen={leg.customerPlan==='ask_cancel'&&leg.state==='en_route'} className="group rounded-xl border border-[#DCE7F4] bg-white p-3">
   <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-bold text-[#142B55]"><span>{leg.leg==='pickup'?'Chiều đón · Nhà → PetDay':'Chiều về · PetDay → Nhà'}{leg.customerPlan==='ask_cancel'&&leg.state==='en_route'?' · CẦN XỬ LÝ HỦY':''}</span><span className="text-xs font-semibold text-[#142B55]">{labels[leg.state]||leg.state} · {money(leg.fee)}</span></summary><div className="mt-3 space-y-2">
   <p className="text-xs text-slate-600">Phí chiều này: {money(leg.fee)}{Number(leg.refundDue)>0?` · Phí được miễn/giảm hoặc xét hoàn: ${money(leg.refundDue)}`:""}</p><p className="rounded-lg bg-[#F0F6FF] px-3 py-2 text-xs text-[#25456B]">{nextStep[leg.state]||"Cập nhật trạng thái từ Admin."}</p>
   {leg.scheduledAt&&<p className="text-xs text-slate-500">Mốc tham chiếu lịch chăm sóc: {new Date(leg.scheduledAt).toLocaleString('vi-VN')}</p>}
   {leg.customerPlan==='ask_cancel'&&leg.state==='en_route'&&<p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Cần xử lý: khách yêu cầu hủy sau xuất phát. Mở “Xử lý ngoại lệ”, xác nhận chưa đón pet rồi chốt phí khách chịu 50%. Nếu chưa thu tiền, chỉ giảm tiền còn phải thu trên hóa đơn.</p>}
   {leg.issueNote&&<p className="rounded-lg bg-slate-50 px-2 py-1 text-xs">Lý do: {leg.issueNote}</p>}
   {bookingStatus!=='Đã hủy'&&(bookingStatus!=='Hoàn tất'||leg.leg==='return')&&<>
    {role==='admin'?<>

     {false&&['en_route','arrived','contacting','under_review','requested','confirmed'].includes(leg.state)&&<textarea className="w-full rounded-lg border p-2 text-xs" rows={2} placeholder="Lý do nếu chuyến không thực hiện được" value={notes[leg.leg]||''} onChange={e=>setNotes(p=>({...p,[leg.leg]:e.target.value}))}/>}
     {false&&leg.leg==='pickup'&&['en_route','arrived','contacting'].includes(leg.state)&&<label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={!!verified[leg.leg]} onChange={e=>setVerified(p=>({...p,[leg.leg]:e.target.checked}))}/><span>Tôi xác nhận xe đến đúng địa chỉ và giờ hẹn, đã liên hệ khách nhưng không gặp khách; có căn cứ ghi nhận sự cố.</span></label>}
     <div className="flex flex-wrap gap-2">
      {leg.state==='requested'&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'confirm')}>Xác nhận Taxi</button>}
      {leg.state==='confirmed'&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'depart')}>Bắt đầu chuyến</button>}
      {['en_route','arrived','contacting'].includes(leg.state)&&leg.customerPlan!=='ask_cancel'&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'complete')}>Hoàn tất · Đã bàn giao pet</button>}
      {false&&leg.leg==='pickup'&&['en_route','arrived','contacting'].includes(leg.state)&&<button disabled={busy||!verified[leg.leg]} className={btn} onClick={()=>execute(leg,'no_show')}>Không gặp khách</button>}



     </div>
     {['requested','confirmed','en_route','arrived','contacting','under_review'].includes(leg.state)&&<details className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs"><summary className="cursor-pointer font-semibold text-amber-900">Xử lý ngoại lệ (hủy / không gặp khách / lỗi PetDay)</summary><div className="mt-3 space-y-2"><textarea className="w-full rounded-lg border p-2 text-xs" rows={2} placeholder="Ghi lý do sự cố (ít nhất 8 ký tự)" value={notes[leg.leg]||''} onChange={e=>setNotes(p=>({...p,[leg.leg]:e.target.value}))}/>{leg.leg==='pickup'&&['en_route','arrived','contacting'].includes(leg.state)&&<label className="flex items-start gap-2"><input type="checkbox" checked={!!verified[leg.leg]} onChange={e=>setVerified(p=>({...p,[leg.leg]:e.target.checked}))}/><span>Xe đã đến đúng hẹn và đã liên hệ nhưng không gặp khách.</span></label>}<div className="flex flex-wrap gap-2">{leg.customerPlan==='ask_cancel'&&leg.state==='en_route'&&<label className="flex items-start gap-2"><input type="checkbox" checked={!!notPicked[leg.leg]} onChange={e=>setNotPicked(p=>({...p,[leg.leg]:e.target.checked}))}/><span>Tôi xác minh khách yêu cầu hủy và pet chưa được đón lên xe (hoàn dự kiến 50% phí chiều này).</span></label>}{leg.customerPlan==='ask_cancel'&&leg.state==='en_route'&&<button disabled={busy||!notPicked[leg.leg]} className={btn} onClick={()=>execute(leg,'cancel_customer_departed')}>Xác nhận hủy theo yêu cầu khách · hoàn 50%</button>}{leg.leg==='pickup'&&['en_route','arrived','contacting'].includes(leg.state)&&<button disabled={busy||!verified[leg.leg]} className={btn} onClick={()=>execute(leg,'no_show')}>Không gặp khách</button>}{['requested','confirmed','en_route','arrived','contacting','under_review'].includes(leg.state)&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'provider_fault')}>Lỗi PetDay</button>}{['requested','confirmed'].includes(leg.state)&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'cancel')}>Hủy trước khi xe đi</button>}{['en_route','arrived','contacting','under_review'].includes(leg.state)&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'review')}>Chờ xác minh</button>}</div></div></details>}
    </>:<>
     {['requested','confirmed'].includes(leg.state)&&<textarea className="w-full rounded-lg border p-2 text-xs" rows={2} placeholder="Ghi chú (nếu có)" value={notes[leg.leg]||''} onChange={e=>setNotes(p=>({...p,[leg.leg]:e.target.value}))}/>}
     <div className="flex flex-wrap gap-2">
      {leg.state==='en_route'&&leg.customerPlan!=='ask_cancel'&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'ask_cancel')}>Yêu cầu hủy · xe đã xuất phát (xét hoàn 50%)</button>}{leg.state==='en_route'&&leg.customerPlan==='ask_cancel'&&<p className="text-xs text-amber-800">Đã yêu cầu hủy; chờ Admin xác minh chưa đón pet. Chưa có khoản hoàn được duyệt.</p>}{leg.leg==='pickup'&&['requested','confirmed'].includes(leg.state)&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'self_arrival')}>Tôi tự đưa pet đến</button>}
      {leg.leg==='return'&&['requested','confirmed'].includes(leg.state)&&<button disabled={busy} className={btn} onClick={()=>execute(leg,'cancel_return')}>Không cần chiều về</button>}
     </div>
     {['no_show','provider_fault','under_review'].includes(leg.state)&&<p className="text-xs text-amber-800">Taxi không tự hủy lịch chăm sóc. Nếu cần đổi hoặc hủy lịch, vui lòng sử dụng chức năng riêng trong Lịch hẹn.</p>}
    </>}
   </>}
   {events.some(e=>e.legId===leg.id)&&<details className="text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Lịch sử Pet Taxi</summary><div className="mt-1 space-y-1">{events.filter(e=>e.legId===leg.id).slice(0,6).map((e,i)=><p key={i}>{new Date(e.at).toLocaleString('vi-VN')} · {e.action}{e.note?' · '+e.note:''}</p>)}</div></details>}
  </div></details>)}
 </section>;
}

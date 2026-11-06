import {useEffect,useState,type FormEvent} from 'react';

type IntakeBooking={code:string;status:string;petName:string;date:string;slot:string;intakeEmergencyPhone?:string;intakeHealthAlerts?:string;intakeCareInstructions?:string;intakeUpdatedAt?:string};
/** Pre-arrival form belongs to a booking; no payment or medical diagnosis in this workflow. */
export default function PreArrivalCard({booking,token,onSaved}:{booking:IntakeBooking;token:string;onSaved:()=>Promise<void>}){
 const [phone,setPhone]=useState(booking.intakeEmergencyPhone||'');
 const [health,setHealth]=useState(booking.intakeHealthAlerts||'');
 const [instructions,setInstructions]=useState(booking.intakeCareInstructions||'');
 const [confirmed,setConfirmed]=useState(false);
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setPhone(booking.intakeEmergencyPhone||'');setHealth(booking.intakeHealthAlerts||'');setInstructions(booking.intakeCareInstructions||'');},[booking.code,booking.intakeUpdatedAt]);
 const editable=['Đang chờ xác nhận','Đã xác nhận'].includes(booking.status);
 async function submit(e:FormEvent){e.preventDefault();setError('');setNotice('');setSaving(true);
  try{const r=await fetch('/api/bookings/'+encodeURIComponent(booking.code)+'/intake',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({emergencyPhone:phone,healthAlerts:health,careInstructions:instructions,ownerConfirmed:confirmed})});
   const body=await r.json().catch(()=>({}));if(!r.ok)throw Error(body.error||'Không lưu được thông tin trước khi đến.');await onSaved();setNotice('Đã lưu thông tin cho nhân viên tiếp nhận.');setConfirmed(false);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setSaving(false)}
 }
 return <details className="petday-intake rounded-2xl border border-[#DAE7F6] bg-[#F8FBFF] p-4" open={false}>
  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-[#142B55]"><span>🐾 Lưu ý trước khi đến <span className="block text-xs font-normal text-slate-500">{booking.intakeUpdatedAt?'Đã gửi thông tin':'Giúp nhân viên tiếp nhận thú cưng an toàn hơn'}</span></span><span className="rounded-full bg-white px-3 py-1 text-xs text-[#142B55]">Xem / chỉnh sửa</span></summary>
  {!editable?<p className="mt-3 text-sm text-slate-600">Lịch đã bắt đầu hoặc kết thúc, không thể tự chỉnh sửa. Hãy liên hệ PetDay nếu có thông tin cần bổ sung.</p>:
  <form onSubmit={submit} className="mt-4 space-y-3 border-t border-[#DAE7F6] pt-4">
   <label className="block text-xs font-bold text-[#142B55]">Số điện thoại liên hệ khẩn cấp <span className="text-red-600">*</span><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" required minLength={9} maxLength={20} placeholder="Ví dụ: 0912345678" autoComplete="tel" className="mt-2 w-full rounded-xl border border-[#CFDDED] bg-white p-3 text-sm" /></label>
   <label className="block text-xs font-bold text-[#142B55]">Dị ứng, thuốc đang dùng hoặc điều cần lưu ý<textarea rows={2} maxLength={600} value={health} onChange={e=>setHealth(e.target.value)} placeholder="Không có thì để trống; thông tin này không thay thế tư vấn thú y" className="mt-2 w-full rounded-xl border border-[#CFDDED] bg-white p-3 text-sm" /></label>
   <label className="block text-xs font-bold text-[#142B55]">Yêu cầu chăm sóc / tính cách thú cưng<textarea rows={2} maxLength={600} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Ví dụ: sợ tiếng ồn, không quen tiếp xúc thú khác..." className="mt-2 w-full rounded-xl border border-[#CFDDED] bg-white p-3 text-sm" /></label>
   <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600"><input required type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-0.5 accent-[#142B55]"/>Tôi xác nhận đã kiểm tra thông tin và đồng ý chia sẻ các lưu ý này cho nhân viên phụ trách lịch hẹn.</label>
   {error&&<p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">{notice}</p>}
   <button type="submit" disabled={!confirmed||saving} className="rounded-xl bg-[#142B55] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-45">{saving?'Đang lưu...':'Lưu thông tin trước lịch hẹn'}</button>
  </form>}
 </details>
}

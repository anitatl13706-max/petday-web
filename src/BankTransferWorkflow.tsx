import {apiFetch} from './apiFetch';
import {TransferDetailsForm, type SenderInfo} from './TransferDetailsForm';
import {useEffect,useState} from 'react';

type Booking={code:string;total:number;paymentMethod?:string;paymentStatus:string;status:string};
type BankRecipient={enabled:boolean;demo?:boolean;bankName?:string;accountHolder?:string;accountNumber?:string};
type Notice={code:string;customerReference?:string;customerNote?:string;senderBank?:string;senderName?:string;createdAt?:string;updatedAt?:string;paymentStatus:string;customerName?:string;total?:number};
const cash=(n:number)=>Number(n||0).toLocaleString('vi-VN')+'đ';
async function request(path:string,token:string,method='GET',body?:object){const response=await apiFetch('/api'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||data.message||'Lỗi API '+response.status);return data;}
export function CustomerBankNotices({token,bookings,focusCode}:{token:string;bookings:Booking[];focusCode?:string}){
 const [bank,setBank]=useState<BankRecipient|null>(null);const [notices,setNotices]=useState<Notice[]>([]);const [ref,setRef]=useState<Record<string,string>>({});const [note,setNote]=useState<Record<string,string>>({});const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState('');
 const refresh=()=>request('/my/transfer-notices',token).then(setNotices).catch(e=>setError(e.message));
 useEffect(()=>{refresh();request('/payment/options',token).then((x:any)=>setBank(x.bankTransfer||null)).catch(()=>setBank(null));},[token]);
 const pending=bookings.filter(b=>b.paymentMethod==='bank_transfer'&&b.paymentStatus==='Chưa thanh toán'&&b.status!=='Đã hủy').sort((a,b)=>Number(b.code===focusCode)-Number(a.code===focusCode));
 useEffect(()=>{if(!focusCode||!pending.some(b=>b.code===focusCode))return;const id=window.setTimeout(()=>{document.getElementById('petday-payment-'+focusCode)?.scrollIntoView({behavior:'smooth',block:'center'});sessionStorage.removeItem('petday_payment_focus_booking');},250);return ()=>window.clearTimeout(id)},[focusCode,bookings.length]);
 if(!pending.length)return null;
 return <section className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-7" aria-label="Thông báo đã chuyển khoản"><h2 className="text-xl font-extrabold text-[#142B55]">Thông tin chuyển khoản & thông báo đã chuyển</h2>{bank?.enabled?<div className="mt-4 rounded-2xl border border-[#D6E6FA] bg-[#F3F8FF] p-4 text-sm text-[#142B55]"><p className="text-xs font-bold uppercase tracking-wide text-[#54739F]">Tài khoản ngân hàng PetDay</p><p className="mt-2">Đơn vị nhận: <strong>{bank.demo?'PetDay Payment':bank.bankName}</strong></p><p>Chủ tài khoản: <strong>{bank.accountHolder}</strong></p>{!bank.demo&&<div className="mt-1 flex flex-wrap items-center gap-2">Số tài khoản: <strong>{bank.accountNumber}</strong><button type="button" className="rounded-lg border border-[#BDD0E9] bg-white px-2 py-1 text-xs font-bold" onClick={()=>navigator.clipboard?.writeText(bank.accountNumber||'')}>Sao chép STK</button></div>}{bank.demo&&<p className="mt-2 rounded-lg bg-white p-2 text-xs font-semibold text-[#A24B38]">Tài khoản thử nghiệm · không chuyển tiền thật.</p>}<p className="mt-2 text-xs text-[#526783]">Nội dung chuyển tiền: dùng đúng mã lịch bên dưới. Không chuyển tiền khi tài khoản nhận chưa được xác minh.</p></div>:<p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Thông tin ngân hàng chưa sẵn sàng. Vui lòng không tự chuyển khoản; liên hệ PetDay để xác nhận.</p>}<p className="mt-2 text-sm text-slate-600">Sau khi chuyển tiền theo nội dung là <strong>mã lịch</strong>, bạn có thể thông báo để nhân viên kiểm tra. Đây không phải xác nhận thanh toán. Mã giao dịch ngân hàng <strong>không bắt buộc</strong> nếu bạn không tìm được.</p>{error&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">Không thể gửi yêu cầu lúc này. Vui lòng liên hệ PetDay hoặc thử lại sau.</p>}{message&&<p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-[#142B55]" role="status">{message}</p>}<div className="mt-4 grid gap-3 lg:grid-cols-2">{pending.map(b=>{const found=notices.find(n=>n.code===b.code);return <div key={b.code} id={"petday-payment-"+b.code} className={"rounded-2xl border p-4 "+(b.code===focusCode?"border-[#142B55] bg-[#EDF4FF] ring-2 ring-[#BFD4F2]":"border-[#E1EAF6] bg-[#F8FAFE]")}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[#142B55]">{b.code}</strong><strong>{cash(b.total)}</strong></div><p className="mt-2 text-xs font-semibold text-[#142B55]">Nội dung chuyển khoản: {b.code} <button type="button" className="ml-2 rounded-lg border bg-white px-2 py-1 text-xs" onClick={()=>navigator.clipboard?.writeText(b.code)}>Sao chép</button></p><p className="mt-1 text-xs text-amber-800">{found?'Đã gửi thông báo · đang chờ kiểm tra tiền':'Chưa gửi thông báo đã chuyển'}</p><TransferDetailsForm code={b.code} total={b.total} recipient={bank} busy={busy===b.code} initial={{customerReference:ref[b.code]??found?.customerReference??'',customerNote:note[b.code]??found?.customerNote??'',senderBank:found?.senderBank||'',senderName:found?.senderName||''}} onSubmit={async(info:SenderInfo)=>{setBusy(b.code);setError('');setMessage('');try{const r=await request('/bookings/'+encodeURIComponent(b.code)+'/transfer-notice',token,'POST',info);setMessage(r.message);await refresh()}catch(e){setError((e as Error).message);throw e}finally{setBusy('')}}}/><p className="mt-2 text-xs text-slate-600">{found?'Thông báo đã gửi. Có thể cập nhật thông tin nếu cần.':'Sau khi gửi, Admin sẽ kiểm tra và xác nhận riêng.'}</p></div>})}</div></section>;
}
export function AdminBankNotices({token,onConfirmed}:{token:string;onConfirmed:()=>Promise<void>|void}){
 const [rows,setRows]=useState<Notice[]>([]);
 const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const [loading,setLoading]=useState(false);const [working,setWorking]=useState('');
 const [refs,setRefs]=useState<Record<string,string>>({});const [notes,setNotes]=useState<Record<string,string>>({});
 const [demo,setDemo]=useState(false);
 const refresh=async()=>{setLoading(true);setError('');try{
  const [notices,opts]=await Promise.all([request('/admin/transfer-notices',token),request('/payment/options',token)]);
  setRows(notices);setDemo(Boolean(opts?.bankTransfer?.demo));
 }catch(e){setError((e as Error).message)}finally{setLoading(false)}};
 useEffect(()=>{refresh()},[token]);
 const pending=rows.filter(x=>x.paymentStatus==='Chưa thanh toán'&&x.bookingStatus!=='Đã hủy');
 const submit=async(x:Notice)=>{
  const reference=(refs[x.code]||'').trim();
  if(!demo&&!reference){setError('Cần nhập mã giao dịch đã kiểm tra trên sao kê ngân hàng.');return;}
  if(!window.confirm(`Xác nhận đã ghi nhận ${cash(x.total||0)} cho lịch ${x.code}? Khách tự khai báo không phải bằng chứng đã thanh toán.`))return;
  setWorking(x.code);setError('');setSuccess('');
  try{
   await request('/admin/bookings/'+encodeURIComponent(x.code)+'/payment',token,'PATCH',{
    paymentStatus:'Đã thanh toán',reference:demo?('TEST-'+x.code):reference,
    note:(demo?'Đối soát mô phỏng trong PetDay. ':'')+((notes[x.code]||'').trim()||'Admin xác nhận thanh toán từ yêu cầu khách gửi.')
   });
   setSuccess('Đã ghi nhận thanh toán cho '+x.code+'. Lịch sử đối soát đã lưu.');
   await refresh();await onConfirmed();
  }catch(e){setError((e as Error).message)}finally{setWorking('')}
 };
 return <section className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-7" aria-label="Chờ xác nhận chuyển khoản">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wider text-[#E16E58]">ĐỐI SOÁT TẬP TRUNG</p><h2 className="mt-1 text-xl font-extrabold text-[#142B55]">Chờ xác nhận chuyển khoản ({pending.length})</h2><p className="mt-1 text-sm text-slate-600">Xem thông tin người gửi, kiểm tra giao dịch và xác nhận ngay tại đây.</p></div><button type="button" className="rounded-xl border border-[#D4E2F3] px-4 py-2 text-sm font-bold text-[#142B55]" onClick={refresh} disabled={loading||!!working}>{loading?'Đang tải...':'Làm mới'}</button></div>
  {demo&&<p className="mt-3 rounded-xl bg-[#FFF7E9] p-3 text-xs text-[#92601D]">Chế độ thử nghiệm: xác nhận chỉ cập nhật dữ liệu trong PetDay, không phải xác nhận tiền đã đến ngân hàng.</p>}
  {error&&<p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{success&&<p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
  <div className="mt-4 grid gap-4 lg:grid-cols-2">{pending.map(x=><article key={x.code} className="rounded-2xl border border-[#DEE9F6] bg-[#F8FBFF] p-4 sm:p-5">
   <div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-lg text-[#142B55]">{x.code}</strong><p className="text-sm text-slate-600">{x.customerName||'Khách hàng'}</p><p className="mt-1 text-xs text-slate-500">Ngày khách báo chuyển: {(x.createdAt||x.updatedAt)?new Date(x.createdAt||x.updatedAt||'').toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}):'—'}</p></div><strong className="text-lg text-[#142B55]">{cash(x.total||0)}</strong></div>
   <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-[#142B55]"><p><span className="text-slate-500">Ngân hàng gửi: </span><strong>{x.senderBank||'Chưa cung cấp'}</strong></p><p><span className="text-slate-500">Người chuyển: </span><strong>{x.senderName||'Chưa cung cấp'}</strong></p><p><span className="text-slate-500">Mã khách báo: </span>{x.customerReference||'Không cung cấp'}</p>{x.customerNote&&<p><span className="text-slate-500">Ghi chú: </span>{x.customerNote}</p>}</div>
   {!demo&&<label className="mt-3 block text-sm font-semibold text-[#142B55]">Mã giao dịch đã đối soát *<input className="mt-1 w-full rounded-xl border border-[#D5E2F0] bg-white px-3 py-2.5" value={refs[x.code]||''} maxLength={120} onChange={e=>setRefs(v=>({...v,[x.code]:e.target.value}))} placeholder="Nhập mã từ sao kê thực nhận"/></label>}
   <label className="mt-3 block text-sm font-semibold text-[#142B55]">Ghi chú đối soát<input className="mt-1 w-full rounded-xl border border-[#D5E2F0] bg-white px-3 py-2.5" maxLength={300} value={notes[x.code]||''} onChange={e=>setNotes(v=>({...v,[x.code]:e.target.value}))} placeholder="Thông tin kiểm tra (nếu có)"/></label>
   <button type="button" className="mt-4 w-full rounded-xl bg-[#142B55] px-4 py-3 text-sm font-bold text-white hover:bg-[#25457B] disabled:opacity-45" disabled={!!working||(!demo&&!(refs[x.code]||'').trim())} onClick={()=>submit(x)}>{working===x.code?'Đang xác nhận...':'Xác nhận thanh toán'}</button>
  </article>)}{!pending.length&&<p className="col-span-full rounded-xl border border-dashed border-[#D4E2F3] p-6 text-center text-sm text-slate-500">Không có lịch chuyển khoản nào đang chờ đối soát.</p>}</div>
  <p className="mt-4 text-xs text-slate-500">Đã thanh toán sẽ tự rời hàng đợi. Sổ thu tiền và Nhật ký đối soát vẫn lưu toàn bộ kết quả.</p>
 </section>;
}

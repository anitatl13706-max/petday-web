import {useCallback,useEffect,useState} from 'react';

type Probe = {key:string;name:string;path:string;ok:boolean|null;detail:string};
const targets = [
 {key:'api',name:'Máy chủ API',path:'/api/health'},
 {key:'schema',name:'Cấu trúc PostgreSQL',path:'/api/health/schema'},
 {key:'services',name:'8 gói dịch vụ',path:'/api/health/services'},
 {key:'workflows',name:'Các bảng nghiệp vụ V6.42',path:'/api/health/workflows'},
 {key:'features',name:'Tính năng gửi email',path:'/api/health/features'},
 {key:'payment',name:'Phương thức thanh toán',path:'/api/payment/options'},
];
export default function SystemCheck(){
 const [probes,setProbes]=useState<Probe[]>(targets.map(t=>({...t,ok:null,detail:'Chưa kiểm tra'})));
 const [busy,setBusy]=useState(false);
 const scan=useCallback(async()=>{
  setBusy(true);
  const checks=await Promise.all(targets.map(async(t):Promise<Probe>=>{
   const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),6500);
   try {
    const res=await fetch(t.path,{signal:ctrl.signal,headers:{Accept:'application/json'}});
    const obj=await res.json();
    let ok=res.ok;
    if(t.key==='api')ok=ok&&obj.ok===true;
    if(t.key==='schema')ok=ok&&obj.schemaReady===true;
    if(t.key==='services')ok=ok&&obj.ok===true&&Array.isArray(obj.missingServiceNames)&&obj.missingServiceNames.length===0;
    if(t.key==='workflows')ok=ok&&obj.workflowSchemaReady===true;
    if(t.key==='payment')ok=ok&&Boolean(obj.cash?.enabled);
    const desc=t.key==='schema'?`schemaReady: ${Boolean(obj.schemaReady)} · thiếu: ${JSON.stringify(obj.missing||[])}`:
      t.key==='services'?`serviceCount: ${obj.serviceCount??'?'} · thiếu: ${JSON.stringify(obj.missingServiceNames||[])}`:
      t.key==='workflows'?`workflowSchemaReady: ${Boolean(obj.workflowSchemaReady)} · thiếu: ${JSON.stringify(obj.missing||[])}`:
      t.key==='payment'?`Chuyển khoản: ${obj.bankTransfer?.enabled?'Đã cấu hình':'Chưa cấu hình ngân hàng'}; tiền mặt là phương thức độc lập`:
      t.key==='features'?`SMTP: ${obj.emailRecovery?.configured===true?'Có cấu hình':'Xem trạng thái chi tiết ở API'}`:
      `HTTP ${res.status} · ${obj.mode||obj.error||'Đã phản hồi'}`;
    return {...t,ok,detail:desc};
   }catch(e){return {...t,ok:false,detail:e instanceof Error?e.message:'Không kết nối được'};}
   finally {clearTimeout(timeout);}
  }));
  setProbes(checks);setBusy(false);
 },[]);
 useEffect(()=>{void scan()},[scan]);
 return <main className="min-h-[60vh] bg-[#F5F8FD] py-10"><div className="container-pd mx-auto max-w-4xl space-y-5">
  <div className="rounded-3xl bg-[#142B55] px-7 py-8 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#FFB19D]">PETDAY · CHẨN ĐOÁN</p><h1 className="mt-2 text-3xl font-extrabold">Kiểm tra hệ thống</h1><p className="mt-2 text-white/75">Chỉ kiểm tra kết nối và cấu hình, không ghi hoặc thay đổi dữ liệu PostgreSQL.</p></div>
  <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-[#142B55]">Các thành phần cần hoạt động</h2><button type="button" disabled={busy} onClick={()=>void scan()} className="rounded-xl bg-[#142B55] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Đang kiểm tra…':'Kiểm tra lại'}</button></div>
   <div className="space-y-3">{probes.map(p=><div key={p.key} className="flex flex-col gap-2 rounded-xl border border-[#E0E9F4] bg-[#F8FAFD] p-4 sm:flex-row sm:justify-between"><div><h3 className="font-bold text-[#142B55]">{p.name}</h3><p className="mt-1 text-xs text-slate-600">{p.path}</p><p className="mt-1 text-sm text-slate-600">{p.detail}</p></div><span role="status" className={'h-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold '+(p.ok===null?'bg-slate-100 text-slate-600':p.ok?'bg-emerald-50 text-emerald-800':'bg-red-50 text-red-700')}>{p.ok===null?'Đang chờ':p.ok?'Đạt':'Cần kiểm tra'}</span></div>)}</div>
  </section>
  <section className="rounded-2xl border border-[#DDE9F8] bg-white p-5 text-sm text-[#142B55]"><h2 className="font-extrabold">Nếu vẫn thấy màn hình trắng</h2><ol className="mt-2 list-inside list-decimal space-y-1 text-slate-700"><li>Mở Terminal frontend V6.43, chạy npm install rồi npm run dev.</li><li>Chỉ dùng một backend trên cổng 4000; kiểm tra file server/.env nhưng không chia sẻ khóa bí mật.</li><li>Nhấn F12 → Console để xem dòng lỗi đỏ; chụp ảnh dòng đầu tiên.</li><li>Không chạy lại migration 001–025 chỉ để chữa lỗi giao diện.</li></ol><p className="mt-3 text-xs text-slate-500">Trạng thái “Đạt” ở đây chưa thay thế kiểm thử đăng ký, đặt lịch, đối soát, nhận hàng và khôi phục mật khẩu bằng email thật.</p></section>
  <a href="/#tai-khoan" className="inline-block rounded-xl bg-[#FF765E] px-5 py-3 font-extrabold text-white">Trở về tài khoản</a>
 </div></main>;
}

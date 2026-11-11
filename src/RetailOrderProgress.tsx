type Props={status:string;fulfillment:string;paymentStatus:string;deliveryEta?:string};
const labels:Record<string,string>={pending:'Đã đặt hàng',confirmed:'Đã xác nhận',ready:'Đang chuẩn bị hàng',shipping:'Đang giao hàng',completed:'Giao hàng thành công',delivery_failed:'Giao hàng thất bại',return_pending:'Đang chờ hàng hoàn',returned:'Đã nhận hàng hoàn',cancelled:'Đơn hàng đã hủy'};
function fmtDate(date?:string){if(!date)return '';const match=String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);return match?`${match[3]}/${match[2]}/${match[1]}`:String(date)}
export default function RetailOrderProgress({status,fulfillment,paymentStatus,deliveryEta}:Props){
 const delivery=fulfillment==='delivery';
 const steps=delivery?['pending','confirmed','ready','shipping','completed']:['pending','confirmed','ready','completed'];
 const index=steps.indexOf(status);
 const isException=['delivery_failed','return_pending','returned','cancelled'].includes(status);
 const statusLabel=status==='completed'&&!delivery?'Khách đã nhận tại quầy':status==='ready'&&!delivery?'Sẵn sàng nhận tại quầy':labels[status]||status;
 return <section className="mt-3 rounded-xl border border-[#D5E3F4] bg-white p-3 sm:p-4" aria-label={'Theo dõi đơn hàng: '+statusLabel}>
  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#142B55]">{delivery?'Tiến trình giao hàng':'Tiến trình nhận tại cửa hàng'}</strong><span className={'rounded-full px-3 py-1 text-xs font-bold '+(isException?'bg-orange-100 text-orange-900':status==='completed'?'bg-emerald-100 text-emerald-800':'bg-[#E8F1FC] text-[#142B55]')}>{statusLabel}</span></div>
  <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step,i)=>{const reached=!isException&&index>=i;const current=!isException&&index===i;return <li key={step} aria-current={current?'step':undefined} className={'flex items-center gap-2 rounded-lg border px-2 py-2 text-xs '+(reached?'border-[#B9D3ED] bg-[#F0F6FD] text-[#142B55]':'border-[#E5EBF3] text-slate-500')}><span className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold '+(reached?'bg-[#142B55] text-white':'bg-slate-100 text-slate-500')}>{reached?'✓':i+1}</span><span>{step==='completed'&&!delivery?'Đã nhận hàng':step==='ready'&&!delivery?'Sẵn sàng nhận':labels[step]}</span></li>})}</ol>
  {delivery&&deliveryEta&&<p className="mt-3 text-xs text-[#405B82]">Dự kiến giao: <strong>{fmtDate(deliveryEta)}</strong></p>}
  {isException&&<p className="mt-3 text-xs text-amber-900">{status==='delivery_failed'?'Giao hàng chưa thành công. PetDay sẽ cập nhật phương án giao lại.':status==='return_pending'?'Đang xử lý hoàn hàng.':'Đơn không tiếp tục giao theo tiến trình thông thường.'}</p>}
  <p className="mt-3 text-xs text-slate-600">Thanh toán: <strong>{paymentStatus==='paid'?'Đã ghi nhận thanh toán':'Chưa ghi nhận thanh toán'}</strong> · Trạng thái giao/nhận được xác nhận riêng.</p>
 </section>;
}

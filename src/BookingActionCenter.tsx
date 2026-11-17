import {countBookingActions} from './bookingActionRules.mjs';

type BookingSummary={code:string;status:string;paymentStatus:string;date:string;intakeUpdatedAt?:string|null;rating?:number|null};
type ActionKind='awaiting'|'intake'|'payments'|'reviews';
const ACTIONS:{id:ActionKind;icon:string;label:string;description:string}[]=[
 {id:'awaiting',icon:'✓',label:'Lịch đã xác nhận',description:'Theo dõi các lịch đã được giữ chỗ trong hệ thống'},
 {id:'intake',icon:'✎',label:'Chuẩn bị trước khi đến',description:'Bổ sung lưu ý chăm sóc nếu cần'},
 {id:'payments',icon:'₫',label:'Thanh toán cần hoàn tất',description:'Xem phương thức và trạng thái xác minh'},
 {id:'reviews',icon:'★',label:'Chưa đánh giá',description:'Chia sẻ trải nghiệm đã hoàn tất'}
];
export default function BookingActionCenter({bookings,onOpen}:{bookings:BookingSummary[];onOpen:(target:ActionKind)=>void}){
 const count=countBookingActions(bookings);const outstanding=Object.values(count).some(n=>n>0);
 return <section className="petday-action-center rounded-3xl border border-[#DFE9F6] bg-white p-5 sm:p-6" aria-labelledby="petday-action-heading">
  <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wider text-[#E16E58]">TRỢ LÝ LỊCH HẸN</p><h2 id="petday-action-heading" className="mt-1 text-xl font-extrabold text-[#142B55]">Việc cần thực hiện</h2><p className="mt-1 text-sm text-slate-500">Tất cả được tổng hợp từ lịch hẹn trong tài khoản của bạn.</p></div><span className="rounded-full bg-[#EEF4FC] px-3 py-2 text-xs font-bold text-[#142B55]">{outstanding?'Có mục cần xử lý':'Đã cập nhật tự động'}</span></div>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{ACTIONS.map(a=><button type="button" key={a.id} onClick={()=>onOpen(a.id)} aria-label={`${a.label}: ${count[a.id]} lịch. Mở phần liên quan`} className="petday-action-tile group flex min-h-32 flex-col items-start rounded-2xl border border-[#E2EAF6] bg-[#F9FBFE] p-4 text-left transition hover:border-[#FFAD9B] hover:bg-[#FFF8F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF765E]"><span className="mb-3 flex w-full items-center justify-between"><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg text-[#142B55]">{a.icon}</span><strong className="text-2xl font-extrabold text-[#142B55]">{count[a.id]}</strong></span><span className="text-sm font-bold text-[#142B55]">{a.label}</span><span className="mt-1 text-xs leading-relaxed text-slate-500">{a.description}</span></button>)}</div>
  <p className="mt-4 text-xs text-slate-500">Các số liệu chỉ để nhắc việc. Riêng thanh toán chuyển khoản vẫn được xác minh độc lập với trạng thái lịch hẹn.</p>
 </section>;
}

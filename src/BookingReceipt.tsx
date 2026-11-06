import type {ReactNode} from 'react';

type Receipt = {code:string;date:string;slot:string;branch:string;service:string;petName:string;status:string;paymentStatus?:string;paymentMethod?:string;total?:number;assignedStaff?:string};
const val=(n:number|undefined)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('vi-VN')+'đ':'Xem chi tiết lịch';
function Detail({label,children}:{label:string;children:ReactNode}){return <div className="petday-receipt-row"><span>{label}</span><strong>{children}</strong></div>}
export default function BookingReceipt({booking,onClose}:{booking:Receipt;onClose:()=>void}){
 return <div className="petday-receipt-overlay" role="dialog" aria-modal="true" aria-label="Phiếu hẹn PetDay" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
  <div className="petday-receipt-sheet" role="document">
   <div className="petday-receipt-actions"><button type="button" onClick={onClose}>Đóng</button><button type="button" onClick={()=>window.print()}>In / lưu PDF</button></div>
   <div className="petday-receipt-head"><span className="petday-receipt-mark">✦</span><div><p>CHĂM SÓC THÚ CƯNG</p><h2>PETDAY</h2></div></div>
   <p className="petday-receipt-subtitle">PHIẾU THÔNG TIN LỊCH HẸN</p>
   <div className="petday-receipt-code">{booking.code}</div>
   <div className="petday-receipt-details">
    <Detail label="Thú cưng">{booking.petName}</Detail>
    <Detail label="Dịch vụ">{booking.service}</Detail>
    <Detail label="Ngày hẹn">{booking.date}</Detail>
    <Detail label="Giờ hẹn">{booking.slot}</Detail>
    <Detail label="Chi nhánh">{booking.branch}</Detail>
    <Detail label="Trạng thái">{booking.status}</Detail>
    <Detail label="Thanh toán">{booking.paymentStatus||'Chưa xác nhận'} ({booking.paymentMethod==='bank_transfer'?'Chuyển khoản':'Tiền mặt'})</Detail>
    <Detail label="Tổng dự kiến">{val(booking.total)}</Detail>
    {booking.assignedStaff&&<Detail label="Nhân viên">{booking.assignedStaff}</Detail>}
   </div>
   <p className="petday-receipt-notice">Phiếu này dùng để tra cứu lịch tại quầy, không phải hóa đơn, biên lai hoặc xác nhận đã thu tiền. Vui lòng theo dõi trạng thái mới nhất trong tài khoản.</p>
   <p className="petday-receipt-footer">PetDay · Đồng hành cùng thú cưng của bạn</p>
  </div>
 </div>
}

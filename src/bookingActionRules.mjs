// Shared pure customer-action rules. No pricing or payment mutation happens here.
const localToday=()=>{const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10)};
export function countBookingActions(bookings,today=localToday()){
 return {
  awaiting:bookings.filter(b=>b.status==='Đã xác nhận'&&String(b.date||'')>=today).length,
  intake:bookings.filter(b=>b.status==='Đã xác nhận'&&String(b.date||'')>=today&&!b.intakeUpdatedAt).length,
  payments:bookings.filter(b=>b.status!=='Đã hủy'&&b.paymentStatus!=='Đã thanh toán').length,
  reviews:bookings.filter(b=>b.status==='Hoàn tất'&&!b.rating).length
 };
}

// Shared pure customer-action rules. No pricing or payment mutation happens here.
export function countBookingActions(bookings,today){
 return {
  awaiting:bookings.filter(b=>b.status==='Đang chờ xác nhận').length,
  intake:bookings.filter(b=>b.status==='Đã xác nhận'&&b.date>=today&&!b.intakeUpdatedAt).length,
  payments:bookings.filter(b=>b.status!=='Đã hủy'&&b.paymentStatus!=='Đã thanh toán').length,
  reviews:bookings.filter(b=>b.status==='Hoàn tất'&&!b.rating).length
 };
}

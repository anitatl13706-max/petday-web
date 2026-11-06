/** Pure, local-date based daily scheduling view. Never mutates booking state. */
export function dailyAgenda(bookings, date, branch='all') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  return bookings.filter(b => b.date === date && (branch === 'all' || b.branch === branch) && b.status !== 'Đã hủy')
    .sort((a,b) => String(a.slot || '').localeCompare(String(b.slot || '')) || String(a.code || '').localeCompare(String(b.code || '')));
}
export function agendaFlags(booking) {
  const isActive = ['Đã xác nhận','Đang thực hiện'].includes(booking.status);
  return {
    needsConfirmation: booking.status === 'Đang chờ xác nhận',
    needsStaff: isActive && !booking.assignedStaff && !booking.assignedStaffId,
    needsPayment: booking.paymentStatus !== 'Đã thanh toán' && booking.status !== 'Đã hủy',
    taxiPending: Boolean(booking.taxiZone && booking.taxiZone !== 'none' && booking.taxiStatus && booking.taxiStatus !== 'confirmed' && booking.taxiStatus !== 'completed' && booking.taxiStatus !== 'Đã xác nhận' && booking.taxiStatus !== 'Đã hoàn thành'),
  };
}

/** UI ordering only. Does not change bookings, payment or service state. */
const pending = b => b.status === 'Đang chờ xác nhận';
const cancelled = b => ['Đã hủy','Không đến'].includes(b.status) || !!b.noShowReason;
const inProgress = b => b.status === 'Đang thực hiện' && !b.careCompleted;
const handoff = b => false; // No separate handoff status in V6.120
const startKey = b => `${b.date || '9999-12-31'}T${b.slot || '23:59'}`;
const waitingForPayment = b => pending(b) || b.status === 'Chờ thanh toán ban đầu';
export function bookingDisplayRank(booking, role = 'customer') {
  const b = booking || {};
  if (cancelled(b) || b.status === 'Hoàn tất') return 90;
  if (role === 'admin') {
    if (inProgress(b)) return 0;
    if (handoff(b)) return 1;
    if (b.status === 'Đã xác nhận') return 2;
    if (waitingForPayment(b)) return 3;
    return 4;
  }
  if (inProgress(b)) return 0;
  if (handoff(b)) return 1;
  if (waitingForPayment(b)) return 2;
  if (b.status === 'Đã xác nhận') return 3;
  return 4;
}
export function compareDisplayBookings(a,b,role='customer') {
  const ra=bookingDisplayRank(a,role), rb=bookingDisplayRank(b,role);
  if(ra!==rb) return ra-rb;
  // History newest first; active/upcoming appointments soonest first.
  const c=startKey(a).localeCompare(startKey(b));
  if(c!==0) return ra===90?-c:c;
  return String(a.code||'').localeCompare(String(b.code||''));
}

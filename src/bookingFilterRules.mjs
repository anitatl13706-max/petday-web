/** Consistent filtering for appointment operations; date format YYYY-MM-DD. */
export function matchesBookingFilters(booking,{branch='all',start='',end=''}={}){
  if(branch!=='all'&&booking.branch!==branch)return false;
  if(start&&booking.date<start)return false;
  if(end&&booking.date>end)return false;
  return true;
}

// Date-only business scheduling in Viet Nam (UTC+07:00, no DST).
export function localDateInVietnam(date = new Date()) {
  return new Date(date.getTime()+7*3600_000).toISOString().slice(0,10);
}
export function tomorrowInVietnam(date = new Date()) {
  return new Date(date.getTime()+7*3600_000+86400_000).toISOString().slice(0,10);
}
export function isReminderEligible({bookingDate,status,alreadySent}, date = new Date()){
  return status === 'Đã xác nhận' && !alreadySent && String(bookingDate).slice(0,10)===tomorrowInVietnam(date);
}

// Explicit opt-in for automated in-app reminders; all other values disable it.
export function automaticRemindersEnabled(value){return value==='true';}

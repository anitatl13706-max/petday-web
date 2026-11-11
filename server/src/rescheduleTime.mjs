// Date-only values must remain calendar dates; do not convert through UTC.
export function sameAppointmentTime(currentDate, currentSlot, proposedDate, proposedSlot) {
  const dateOnly = value => typeof value === 'string' ? value.trim().slice(0, 10) : '';
  const hhmm = value => typeof value === 'string' ? value.trim().slice(0, 5) : '';
  return dateOnly(currentDate) === dateOnly(proposedDate)
    && hhmm(currentSlot) === hhmm(proposedSlot);
}

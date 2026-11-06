/** Pre-arrival intake is editable only before check-in, not after service starts. */
export function intakeEditIssue(status, checkedIn){
 if(!['Đang chờ xác nhận','Đã xác nhận'].includes(status))return 'Chỉ cập nhật thông tin trước khi thú cưng được tiếp nhận.';
 if(checkedIn)return 'Thú cưng đã check-in, vui lòng liên hệ nhân viên để cập nhật lưu ý.';
 return null;
}
/** Phone number accepted as text. Caller still validates request body via Zod. */
export function validEmergencyPhone(phone){
 return typeof phone==='string' && /^\+?[0-9][0-9 .-]{7,18}[0-9]$/.test(phone.trim());
}

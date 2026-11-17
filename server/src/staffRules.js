// Deterministic preconditions for a single-slot staff assignment. Database constraints
// and row/advisory locks remain the final authority for concurrent assignments.
export function staffAssignmentIssue({bookingStatus,staffActive,bookingBranch,staffBranch,hasShift,isBusy}){
 if(bookingStatus!=='Đã xác nhận')return 'Lịch chưa ở trạng thái đã xác nhận.';
 if(!staffActive||bookingBranch!==staffBranch)return 'Nhân viên không hoạt động hoặc sai chi nhánh.';
 if(!hasShift)return 'Nhân viên không có ca trực phù hợp.';
 if(isBusy)return 'Nhân viên đã có lịch trong cùng khung giờ.';
 return null;
}
export function careStepIssue(eventType,{status,hasPetArrived=false,hasCheckIn,hasCareUpdate,hasReady,hasCheckOut}){
 if(eventType==='pet_arrived')return (status==='Đã xác nhận'&&!hasPetArrived&&!hasCheckIn)?null:'Chỉ tiếp nhận pet một lần, sau khi lịch được xác nhận.';
 if(eventType==='check_in')return (status==='Đã xác nhận'&&hasPetArrived&&!hasCheckIn)?null:'Dịch vụ đã bắt đầu khi tiếp nhận pet; không cần bấm Bắt đầu lần nữa.';
 if(eventType==='care_update')return (status==='Đang thực hiện'&&hasCheckIn&&!hasCheckOut)?null:'Chỉ cập nhật chăm sóc trước bàn giao.';
 if(eventType==='ready')return (status==='Đang thực hiện'&&hasCheckIn&&hasCareUpdate&&!hasReady)?null:'Cần cập nhật chăm sóc trước khi sẵn sàng bàn giao.';
 if(eventType==='check_out')return (status==='Đang thực hiện'&&hasCheckIn&&!hasCheckOut)?null:'Chỉ hoàn tất sau khi đã bắt đầu dịch vụ và chưa bàn giao.';
 return 'Mốc chăm sóc không hợp lệ.';
}

// Absence never incurs an automatic payment or fee. Keep it distinct from cancellation.
export function noShowIssue({status,paymentStatus,hasServiceEvent}){
 if(status!=='Đã xác nhận')return 'Chỉ ghi nhận không đến cho lịch đã xác nhận.';
 // No-show depends on attendance, not on payment. A prepaid no-show requires a separate refund decision.
 if(hasServiceEvent)return 'Đã tiếp nhận thú cưng, không thể đánh dấu không đến.';
 return null;
}

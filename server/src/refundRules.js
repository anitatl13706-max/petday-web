/** Pure guards for the manual refund workflow. Payment and service states are distinct. */
export function refundEligibility({paymentStatus,status,total,existing=false}) {
 if(existing)return 'Lịch đã có yêu cầu hoàn tiền.';
 if(paymentStatus!=='Đã thanh toán')return 'Chưa ghi nhận thu tiền, không thể hoàn tiền.';
 if(!['Hoàn tất','Đã hủy','Không đến'].includes(status))return 'Chỉ yêu cầu hoàn tiền khi lịch kết thúc hoặc đã hủy.';
 if(!Number.isFinite(Number(total))||Number(total)<=0)return 'Không có khoản tiền đã thu để hoàn.';
 return null;
}
export function refundDecisionIssue(current,decision,paid){
 if(!paid)return 'Không còn khoản thanh toán được ghi nhận.';
 if(decision==='complete'&&current!=='approved')return 'Phải duyệt yêu cầu trước khi xác nhận đã hoàn tiền.';
 if(decision!=='complete'&&current!=='pending')return 'Yêu cầu không còn trong trạng thái chờ xem xét.';
 return null;
}
/** Validate the manual refund amount before an approval is persisted. */
export function refundAmountIssue(amount,total,reason=''){
 if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(Number(total))||amount>Number(total))return 'Số tiền hoàn phải lớn hơn 0 và không vượt quá số tiền đã thu.';
 if(amount<Number(total)&&reason.trim().length<8)return 'Hoàn một phần cần ghi lý do ít nhất 8 ký tự.';
 return null;
}

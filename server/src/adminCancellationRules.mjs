import { cancellationPolicy } from './cancellationPolicy.mjs';
/** Rules for the two distinct administrator cancellation origins. */
export function adminCancellationTerms({origin,date,slot,at,total,paid,exceptionRefundAmount}) {
 if(!['customer_assisted','provider_unavailable'].includes(origin))return {issue:'Phải chọn đúng nguồn hủy lịch.'};
 const amount=Number(total);
 if(!Number.isSafeInteger(amount)||amount<0)return {issue:'Tổng tiền lịch không hợp lệ.'};
 const policy=cancellationPolicy({date,slot,requestedAt:at,total:amount});
 if(origin==='customer_assisted'&&['invalid','started'].includes(policy.window))return {issue:'Không thể hủy hộ theo yêu cầu khách sau khi giờ hẹn bắt đầu.'};
 if(origin==='customer_assisted'&&exceptionRefundAmount!==undefined&&(
  policy.window!=='late'||!paid||!Number.isSafeInteger(exceptionRefundAmount)||exceptionRefundAmount<0||exceptionRefundAmount>amount
 ))return {issue:'Ngoại lệ chỉ dành cho lịch đã thanh toán hủy sát giờ, không vượt khoản đã thu.'};
 if(origin==='provider_unavailable'&&exceptionRefundAmount!==undefined)return {issue:'Hủy do PetDay không thể phục vụ phải hoàn theo chính sách, không nhập ngoại lệ.'};
 const refundAmount=paid?(origin==='provider_unavailable'?amount:exceptionRefundAmount??policy.refundAmount):0;
 return {policy,refundAmount,origin};
}

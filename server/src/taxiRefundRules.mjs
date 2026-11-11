// Pure rules for the demo's manually reconciled, per-leg Pet Taxi refund ledger.
export function taxiRefundCreateIssue({state,refundDue,fee,collected=0,serviceReserved=0,taxiReserved=0}){
 if(!Number.isSafeInteger(Number(collected))||Number(collected)<=0)return 'Chưa ghi nhận tiền đã thu; chỉ miễn phí, không lập khoản hoàn.';
 if(!['cancelled','customer_self','provider_fault'].includes(state))return 'Chỉ lập hồ sơ cho chiều Taxi đã đóng và đủ điều kiện hoàn.';
 if(!Number.isSafeInteger(Number(refundDue))||Number(refundDue)<=0||Number(refundDue)>Number(fee))return 'Khoản hoàn phải dương và không vượt phí chiều Taxi.';
 if(Number(serviceReserved)+Number(taxiReserved)+Number(refundDue)>Number(collected))return 'Tổng hồ sơ hoàn vượt khoản đã thu; cần đối soát hồ sơ dịch vụ.';
 return null;
}
export function taxiRefundTransitionIssue(current,decision){
 if(decision==='complete')return current==='approved'?null:'Phải duyệt hoàn trước khi xác nhận đã hoàn.';
 if(decision==='approve'||decision==='reject')return current==='pending'?null:'Hồ sơ không còn chờ duyệt.';
 return 'Thao tác hoàn tiền không hợp lệ.';
}

// A partial cash/bank receipt may exceed the corrected invoice even when the
// booking is not marked fully paid. Refund only that actual overpayment.
export function refundableTaxiAmount({refundDue,refundCandidate}){
 const due=Number(refundDue),cash=Number(refundCandidate);
 if(!Number.isSafeInteger(due)||!Number.isSafeInteger(cash)||due<0||cash<0)throw Error('Số tiền hoàn không hợp lệ.');
 return Math.min(due,cash);
}

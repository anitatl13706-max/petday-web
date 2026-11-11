// V6.103.9: Small, auditable state machine for each independent Taxi direction.
// No timed wait counter or driver application is required by the website.
export function taxiLegTransitionIssue(leg,action){
 const allowed={
  confirm:['requested'], depart:['confirmed'],
  complete:['en_route','arrived','contacting'],
  no_show:['en_route','arrived','contacting','under_review'],
  provider_fault:['requested','confirmed','en_route','arrived','contacting','under_review'],
  cancel:['requested','confirmed'],
  cancel_customer_departed:['en_route'],
  review:['en_route','arrived','contacting','under_review'],
  // Legacy-only actions are rejected to keep the new workflow consistent.
 };
 if(!allowed[action]||!allowed[action].includes(leg.state))return 'Trạng thái chuyến không cho phép thao tác này.';
 if(action==='no_show'&&leg.leg!=='pickup')return 'Không gặp khách chỉ áp dụng với chiều đón.';
 return null;
}
// Cancellation after departure is only valid when the pet has NOT been collected.
// VND is an integer: for odd fees round the customer's refund DOWN.
export function taxiCustomerCancellationRefund(fee){
 const amount=Number(fee);
 if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Phí Taxi không hợp lệ.');
 return Math.floor(amount/2);
}
export function taxiRefundPreview(leg){
 if(['cancelled','customer_self','provider_fault'].includes(leg.state))return Number(leg.refund_due||0);
 return 0;
}

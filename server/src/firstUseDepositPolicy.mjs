// PetDay V6.114: 20% of care services only, never Taxi or retail goods.
// Discounts are conservatively allocated to care first (not to Taxi/retail).
export function careBaseFromLines(lines){
 if(!Array.isArray(lines))throw new Error('Hóa đơn dịch vụ không hợp lệ.');
 const excluded=new Set(['taxi','retail','first_use_deposit','schedule']);
 let care=0,discount=0;
 for(const l of lines){
  const value=Number(l?.amount);
  if(!Number.isSafeInteger(value))throw new Error('Giá trị dòng tiền không hợp lệ.');
  if(value<0){discount+=-value;continue;}
  if(!excluded.has(l?.type))care+=value;
 }
 return Math.max(0,care-discount);
}
export function firstUseDepositAmount(lines){return Math.ceil(careBaseFromLines(lines)/5);}

// Amount of service money to return after a cancellation. Fees are retained
// from money already received, so a small deposit is not automatically fully refundable.
export function serviceCancellationRefund({careCharge,policyRefund,actuallyCollected,otherRefundReserved=0}){
 const nums=[careCharge,policyRefund,actuallyCollected,otherRefundReserved].map(Number);
 if(nums.some(n=>!Number.isSafeInteger(n)||n<0))throw new Error('Khoản tiền không hợp lệ.');
 const [base,eligible,paid,reserved]=nums;
 if(eligible>base)throw new Error('Khoản quyền hoàn vượt phần chăm sóc.');
 const retained=base-eligible;
 return Math.max(0,Math.min(eligible,paid-reserved-retained));
}

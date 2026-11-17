/** PetDay finance presentation rules. Values are VND integer amounts, sourced from confirmed receipts. */
const n=v=>Number.isFinite(Number(v))?Math.max(0,Math.trunc(Number(v))):0;
export const PAYMENT_PLAN_LABELS={DEPOSIT_20:'Cọc trước 20%',FULL_PREPAY:'Thanh toán toàn bộ',PAY_LATER:'Thanh toán khi sử dụng dịch vụ'};
export const PAYMENT_STAGE_LABELS={UNPAID:'Chưa thanh toán',DEPOSIT_PENDING:'Chờ đủ cọc',DEPOSIT_PAID:'Đã cọc 20%',PARTIALLY_PAID:'Đã thanh toán một phần',PAID:'Đã thanh toán đủ'};
export function summariseBookingPayment(b){
 const total=n(b.total),required=n(b.lineItems?.find(x=>x.type==='first_use_deposit')?.requiredAmount);
 const bank=n(b.bankPaid??b.depositPaid),cash=n(b.cashPaid);
 const collected=n(b.collectedPaid??bank+cash);
 // Never describe an entire transfer as a deposit. Only purpose-tagged receipts
 // count as a deposit; older unclassified entries remain visible as bank receipts.
 const depositApplied=Math.min(required,n(b.depositApplied));
 const remaining=Math.max(0,total-collected);
 const plan= b.paymentPlan || (required>0 ? null : 'PAY_LATER');
 let stage='UNPAID';
 if(total>0&&remaining===0)stage='PAID';
 else if(required>0 && collected===0)stage='DEPOSIT_PENDING';
 else if(required>0 && collected<required)stage='DEPOSIT_PENDING';
 else if(required>0 && plan==='DEPOSIT_20' && depositApplied>=required && collected===depositApplied)stage='DEPOSIT_PAID';
 else if(collected>0)stage='PARTIALLY_PAID';
 return {total,required,bank,cash,collected,depositApplied,depositRemaining:Math.max(0,required-depositApplied),remaining,plan,stage};
}

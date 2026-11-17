export type PaymentPlan = 'DEPOSIT_20'|'FULL_PREPAY'|'PAY_LATER';
export type PaymentStage = 'UNPAID'|'DEPOSIT_PENDING'|'DEPOSIT_PAID'|'PARTIALLY_PAID'|'PAID';
export const PAYMENT_PLAN_LABELS: Record<PaymentPlan,string>;
export const PAYMENT_STAGE_LABELS: Record<PaymentStage,string>;
export function summariseBookingPayment(booking:{total:number;lineItems?:Array<{type?:string;requiredAmount?:number}>;paymentPlan?:string|null;collectedPaid?:number;depositApplied?:number;bankPaid?:number;cashPaid?:number;depositPaid?:number}):{
 total:number;required:number;bank:number;cash:number;collected:number;depositApplied:number;depositRemaining:number;remaining:number;plan:string|null;stage:PaymentStage;
};

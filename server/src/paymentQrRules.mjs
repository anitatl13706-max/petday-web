// Server-side window for reporting a simulated transfer, NOT proof of payment.
export const PAYMENT_QR_MINUTES=15;
export function reportWindowOpen(session, now=new Date()) {
 return Boolean(session && !session.reported_at && new Date(session.expires_at).getTime() > now.getTime());
}
export function qrPayload(kind, code, total) {
 if(!['booking','retail'].includes(kind)||!/^P[DS]-[A-Z0-9-]{5,45}$/.test(code)||!Number.isFinite(Number(total))||Number(total)<0)throw Error('QR parameters invalid');
 return `PETDAY-DEMO|${kind}|${code}|${Math.round(Number(total))}VND|NO-BANK-TRANSFER`;
}

// Server-authoritative amount for a booking QR. A required-deposit line only
// limits DEPOSIT_20; FULL_PREPAY and bank transfer always use the full balance.
export function bookingQrAmount({total,paidSoFar=0,depositRequired=0,paymentMethod,paymentPlan}) {
 const values=[total,paidSoFar,depositRequired].map(Number);
 if(values.some(value=>!Number.isSafeInteger(value)||value<0))throw Error('Booking QR amount inputs invalid');
 const [charge,paid,deposit]=values;
 const remaining=Math.max(0,charge-paid);
 if(paymentMethod==='bank_transfer'||paymentPlan==='FULL_PREPAY')return remaining;
 if(paymentMethod==='cash'&&paymentPlan==='DEPOSIT_20')return Math.min(Math.max(0,deposit-paid),remaining);
 throw Error('Booking payment plan is not eligible for QR');
}

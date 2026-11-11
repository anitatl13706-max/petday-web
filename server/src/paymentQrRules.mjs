// Server-side window for reporting a simulated transfer, NOT proof of payment.
export const PAYMENT_QR_MINUTES=15;
export function reportWindowOpen(session, now=new Date()) {
 return Boolean(session && !session.reported_at && new Date(session.expires_at).getTime() > now.getTime());
}
export function qrPayload(kind, code, total) {
 if(!['booking','retail'].includes(kind)||!/^P[DS]-[A-Z0-9-]{5,45}$/.test(code)||!Number.isFinite(Number(total))||Number(total)<0)throw Error('QR parameters invalid');
 return `PETDAY-DEMO|${kind}|${code}|${Math.round(Number(total))}VND|NO-BANK-TRANSFER`;
}

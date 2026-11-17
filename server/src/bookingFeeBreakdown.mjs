// Use booked amounts, not current tariffs. The grand total is authoritative.
export function bookingFeeBreakdown({total,lineItems,taxiFee=0}){
 const lines=Array.isArray(lineItems)?lineItems:[];
 const sum=type=>lines.filter(x=>x?.type===type).reduce((n,x)=>n+Math.max(0,Number(x.amount)||0),0);
 const grand=Math.max(0,Number(total)||0);
 const taxi=Math.min(grand, sum('taxi')||Math.max(0,Number(taxiFee)||0));
 const retail=Math.min(grand-taxi,sum('retail'));
 return {careFee:grand-taxi-retail,taxiFee:taxi,retailFee:retail};
}

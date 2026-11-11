// Service refund base excludes separately tracked Taxi and take-home retail items.
// A promotion discount is conservatively allocated to the service portion first,
// so total refundable components can never exceed the actual invoice paid.
export function serviceRefundBase(total,lineItems){
 const paid=Number(total);
 if(!Number.isSafeInteger(paid)||paid<0)return 0;
 const extras=(Array.isArray(lineItems)?lineItems:[]).filter(x=>['taxi','retail'].includes(x?.type)).reduce((sum,x)=>sum+Math.max(0,Number(x?.amount)||0),0);
 return Math.max(0,paid-extras);
}

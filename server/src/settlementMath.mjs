// Pure VND accounting rules for partial cash receipts and Taxi waivers.
// No payment means no money can be sent back to the customer.
export function settle({total,collected,taxiWaived=0,serviceReserved=0,refundCompleted=0,refundPending=0}){
 const values=[total,collected,taxiWaived,serviceReserved,refundCompleted,refundPending];
 if(values.some(x=>!Number.isSafeInteger(Number(x))||Number(x)<0))throw Error('Số tiền không hợp lệ.');
 if(taxiWaived>total||serviceReserved>total||refundCompleted+refundPending>collected)throw Error('Phân bổ tiền không hợp lệ.');
 const charge=Math.max(0,total-taxiWaived-serviceReserved);
 const netCollected=collected-refundCompleted;
 return {charge,outstanding:Math.max(0,charge-netCollected),refundCandidate:Math.max(0,netCollected-charge-refundPending)};
}

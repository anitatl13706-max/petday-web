export const PREPAYMENT_REASONS = Object.freeze({
  NO_COMPLETED_SERVICE: 'NO_COMPLETED_SERVICE',
  TWO_CONSECUTIVE_CUSTOMER_CANCELLATIONS: 'TWO_CONSECUTIVE_CUSTOMER_CANCELLATIONS',
  ELIGIBLE_FOR_PAY_LATER: 'ELIGIBLE_FOR_PAY_LATER',
});

export function decidePrepaymentPolicy({hasCompletedService,recentTerminalOutcomes=[]}){
  if(!hasCompletedService)return {required:true,reason:PREPAYMENT_REASONS.NO_COMPLETED_SERVICE};
  const latest=recentTerminalOutcomes.slice(0,2);
  if(latest.length===2&&latest.every(outcome=>outcome==='customer_cancel')){
    return {required:true,reason:PREPAYMENT_REASONS.TWO_CONSECUTIVE_CUSTOMER_CANCELLATIONS};
  }
  return {required:false,reason:PREPAYMENT_REASONS.ELIGIBLE_FOR_PAY_LATER};
}

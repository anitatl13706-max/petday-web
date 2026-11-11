/** Reschedule permissions and Taxi safety are independent of payment method. */
export function rescheduleDecisionIssue({role,userId,customerId,requestedBy}){
  const customerProposed=Number(requestedBy)===Number(customerId);
  if(role==='customer'&&(Number(userId)!==Number(customerId)||customerProposed))return 'Chỉ khách sở hữu lịch được quyết định đề xuất của PetDay.';
  if(role==='admin'&&!customerProposed)return 'Đề xuất của PetDay phải do khách quyết định.';
  if(!['customer','admin'].includes(role))return 'Không có quyền quyết định yêu cầu đổi lịch.';
  return null;
}
export function taxiLegPreventsAutomaticReschedule(state){
  return !['requested','confirmed'].includes(String(state));
}

// Physical care completion is independent of receiving the pet back.
export function canCloseWithCustomerHandoff({bookingStatus,careCompleted,alreadyHandedOver,returnState}){
 if(bookingStatus!=='Đang thực hiện'||!careCompleted||alreadyHandedOver)return false;
 return !returnState||['cancelled','customer_self','provider_fault','no_show'].includes(returnState);
}
export function canDepartReturnTaxi({careCompleted,returnState}){
 return Boolean(careCompleted)&&returnState==='confirmed';
}

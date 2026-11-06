// PetDay V6.67 - single source of truth for independent retail fulfillment flow.
export function retailNextStatuses(status,fulfillment='pickup'){
 const allowed={
  pending:['confirmed','cancelled'],
  confirmed:['ready','cancelled'],
  ready:fulfillment==='delivery'?['shipping','cancelled']:['completed','cancelled'],
  shipping:['completed'],delivery_failed:[],return_pending:[],returned:[],completed:[],cancelled:[]
 };
 return allowed[status]||[];
}
export function retailTransitionIssue({status,nextStatus,fulfillment='pickup',paymentMethod='cash',paid=false,hasPaymentReference=false,hasDeliveryEta=false}){
 if(!retailNextStatuses(status,fulfillment).includes(nextStatus))return 'Trạng thái đơn không thể chuyển theo thứ tự này.';
 if(nextStatus==='shipping'){
  if(!hasDeliveryEta)return 'Phải nhập ngày dự kiến giao trước khi chuyển Đang giao.';
  if(paymentMethod==='bank_transfer'&&!paid&&!hasPaymentReference)return 'Đơn chuyển khoản phải được đối soát trước khi giao.';
 }
 if(nextStatus==='completed'&&!paid&&!hasPaymentReference)return 'Phải ghi nhận thanh toán trước khi hoàn tất đơn.';
 if(nextStatus==='cancelled'&&(paid||hasPaymentReference))return 'Đơn đã thu tiền cần quy trình hoàn tiền riêng.';
 return null;
}
// Transfer notice reports are not payments: allow only an unpaid active bank-transfer order.
export function retailTransferNoticeIssue({paymentMethod,paymentStatus,status}){
 if(paymentMethod!=='bank_transfer')return 'Đơn này chọn thanh toán tiền mặt.';
 if(paymentStatus!=='unpaid')return 'Đơn đã được ghi nhận thanh toán.';
 if(status==='cancelled')return 'Đơn đã hủy, không thể gửi thông báo.';
 return null;
}

// Shared cancellation guards: do not cancel shipped/delivered orders as ordinary cancellation.
export function customerRetailCancellationIssue(status,existingRequest=false){
 if(existingRequest)return 'Đơn đã có yêu cầu hủy. Vui lòng theo dõi kết quả.';
 if(!['pending','confirmed','ready'].includes(status))return 'Đơn đã giao hoặc đang vận chuyển; vui lòng liên hệ CSKH để xử lý.';
 return null;
}
export function adminRetailCancellationIssue({requestStatus,orderStatus,paymentMethod,paymentStatus,hasTransferNotice}){
 if(requestStatus!=='pending')return 'Yêu cầu hủy đã được xử lý.';
 if(!['pending','confirmed','ready'].includes(orderStatus))return 'Trạng thái đơn đã thay đổi; không thể duyệt hủy thông thường.';
 if(paymentMethod==='bank_transfer'&&paymentStatus!=='paid'&&hasTransferNotice)return 'Khách đã báo chuyển khoản; cần đối soát trước khi duyệt hủy để tránh bỏ sót khoản hoàn.';
 return null;
}

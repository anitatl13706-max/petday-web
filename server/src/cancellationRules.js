// Pure rules for cancellation requests. Payment/refunds remain a separate workflow.
export function cancellationRequestIssue({role,status,bookingDate,today,alreadyPending,paid=false}) {
 if(role!=='customer')return 'Chỉ khách hàng được gửi yêu cầu.';
 if(!(['Đã xác nhận'].includes(status)||(paid&&status==='Đang chờ xác nhận')))return 'Chỉ có thể hủy lịch chưa bắt đầu chăm sóc.';
 if(bookingDate<=today&&!paid)return 'Yêu cầu hủy phải gửi trước ngày hẹn.';
 if(alreadyPending)return 'Đã có yêu cầu hủy chờ xử lý.';
 return null;
}
export function cancellationDecisionIssue({requestStatus,bookingStatus,hasCareEvents}) {
 if(requestStatus!=='pending')return 'Yêu cầu đã được xử lý.';
 if(hasCareEvents)return 'Đã bắt đầu quá trình chăm sóc, không thể duyệt hủy theo luồng thông thường.';
 // A confirmed booking may have been moved back to pending by Admin while the
 // customer's cancellation request was waiting. Both states are safe to cancel
 // before care begins. Never silently approve completed/no-show/closed bookings.
 if(['Đã xác nhận','Đang chờ xác nhận'].includes(bookingStatus))return null;
 if(bookingStatus==='Đã hủy')return 'Lịch đã được hủy bằng thao tác khác; yêu cầu cũ cần được đối chiếu và đóng riêng.';
 if(bookingStatus==='Đang thực hiện')return 'Dịch vụ đang thực hiện, không thể duyệt hủy.';
 if(bookingStatus==='Hoàn tất')return 'Dịch vụ đã hoàn tất, không thể duyệt hủy.';
 return `Không thể duyệt hủy vì trạng thái lịch hiện tại là: ${bookingStatus || 'không xác định'}.`;
 return null;
}

/** PetDay refund policy: when payment is recorded but no service/goods were received, refund 100%.
 * This computes financial eligibility; it does not instruct a bank or mark a refund as completed.
 */
export const serviceNotProvided = (status) => status === 'Đã hủy';
export const retailNotReceived = (status) => ['cancelled','returned'].includes(status);
export function fullRefundDecisionIssue({mandatory,decision,amount,total}) {
 if (!mandatory || decision === 'complete') return null;
 if (decision === 'reject') return 'Giao dịch đã thu tiền nhưng chưa cung cấp dịch vụ/hàng hóa: phải hoàn 100%.';
 if (decision === 'approve' && amount !== undefined && Number(amount) !== Number(total)) return 'Phải hoàn 100% số tiền đã ghi nhận.';
 return null;
}

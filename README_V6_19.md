# PetDay V6.19 – Refund & Reconciliation

Kế thừa V6.18, giữ nguyên menu gọn. Có các luồng: khách gửi yêu cầu hoàn tiền, Admin duyệt/từ chối, ghi nhận khoản hoàn sau khi đã thực hiện thực tế, thông báo và thống kê tiền đã thu - tiền đã hoàn.

**Nâng cấp**: sao lưu database `petday`, đảm bảo đã chạy đến SQL 015, chạy `database/016_v619_refund_reconciliation.sql`; sao chép `server/.env` từ phiên bản cũ (không có trong ZIP).

**Kiểm tra**: `cd server && npm install && npm test`; `npm run dev` chạy API; terminal frontend riêng `npm install && npm run dev`. Kiểm tra `/api/health/schema`.

**Phạm vi**: Không gửi tiền thật, không có webhook ngân hàng, không hỗ trợ hoàn tiền một phần. Tất cả giao dịch đều cần đối chiếu thủ công của người có quyền.

Xem `docs/V6_19_REFUND_FINANCE.md` cho quy trình và kịch bản kiểm thử.

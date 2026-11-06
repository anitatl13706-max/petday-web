# PetDay V6.45 – Booking integrity & additional service

This full source builds on V6.44.1. No `.env`, passwords, tokens or user data are bundled.

**What changed**
- Adds `Đặt thêm dịch vụ khác` on the customer appointment list; one additional service creates a **separate** appointment, with a separate receipt and payment. This is **not** a multiple-service single-checkout feature.
- The backend checks service time intervals and rejects overlapping bookings for the same pet on the same day (even across branches), with an advisory lock to avoid concurrent duplicates.
- Adds optional, idempotent migration **027** to repair an outdated 3-package `bookings_service_check` constraint to the 8 supported packages, while preserving existing appointments.
- Leaves admin bank configuration and manual settlement workflow from V6.44.1 unchanged. No automatic payments or fake bank confirmations.

**For the student's currently reported HTTP 503**
1. Confirm backup of `petday` succeeded; do not run migrations blindly.
2. Check `http://localhost:4000/api/health/services`. If it returns `missingServiceNames` with names, inspect SQL 022 and run `database/027_v645_booking_service_constraint_repair.sql` after backing up. Recheck the endpoint.
3. PostgreSQL has already been shown to contain 024/025/026 retail/price tables. Do not rerun them just because `/bookings` returns a service-check 503.
4. Copy `server/.env` from the last working version to this version; keep it private.
5. Start `server` with `npm install && npm test && npm run dev`, and frontend with `npm install && npm run build && npm run dev` in separate terminals. If `npm run build` fails, stop and fix that first.

**Bank transfer**
- Admin → Finance → Bank settings: enter actual authorized bank name, account number, account holder; Save.
- GET `http://localhost:4000/api/payment/options`: `bankTransfer.enabled` must be `true`.
- Customer books a service with bank transfer and receives unique booking code in **Lịch hẹn → Thanh toán**. Customer transfers and can notify PetDay; staff confirms only after seeing real bank credit and reference.
- No VietQR bank-code assumption or payment gateway IPN exists, so this is manual reconciliation, not online auto-payment.

Full QA steps: `docs/V6_45_FIXES_AND_MULTI_SERVICE_WORKFLOW.md`.

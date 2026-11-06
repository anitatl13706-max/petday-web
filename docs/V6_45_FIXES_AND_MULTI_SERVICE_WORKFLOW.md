# PetDay V6.45 – Integrity & sequential additional services

## Confirmed from user screenshots
- Retail total **483,000 VND** = 140,000 base + 50,000 weight + 70,000 Pet Taxi + 79,000 brush + 45,000 wipes + 99,000 bag. **Frontend arithmetic matches**; database stock must be verified after successful booking.
- 8 service check error HTTP 503 is **independent** of presence of tables 024/025/026. Inspect `/api/health/services` and the **actual** `bookings_service_check` constraint.
- Bank transfer disabled means no valid recipient configured. Admin Finance → bank settings → save; GET `/api/payment/options` `bankTransfer.enabled` should become true. No fabricated account; no auto-confirmation.

## Two service rule
- Each booking carries ONE main service and optionally up to three relevant service add-ons and three retail product lines.
- Customer can use **Đặt thêm dịch vụ khác** from their appointment history; this opens the booking wizard with the same pet and branch, separate booking code, independent availability, payment and staff assignment.
- Backend now serializes submissions by pet+date and prevents overlapping time intervals for that pet, even across branches. The existing branch/slot capacity lock remains.
- **Not** a one-checkout two-package cart. To build a combined checkout later, use `booking_groups`, atomic multi-row booking transaction and combined payment intent with proportional cancellations/refunds. Do not claim this exists.

## Migration
1. Back up `petday` using pgAdmin, verify backup success and nonzero file.
2. Run read-only `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.bookings'::regclass AND conname='bookings_service_check';`.
3. Only if 8 names are missing, review and run `database/027_v645_booking_service_constraint_repair.sql`. This script is idempotent, changes only the named CHECK and preserves booked rows.
4. Recheck `GET /api/health/services`: `missingServiceNames` must be `[]`.
5. Do not re-run SQL 001–026 or recreate the database.

## Manual acceptance checks
- No more 503 for missing service names; test a Grooming basic booking and confirm actual `bookings` row & optional retail lines.
- Verify each of the selected retail products has exactly the reserved quantity subtracted. Cancel only an unpaid eligible booking and verify stock return once.
- Create another booking for same pet at an overlapping time → HTTP 409, no stock loss or partial reservation. Choose nonoverlapping time → separate booking can be placed.
- Admin finance: configure recipient, refresh `/api/payment/options`, book bank transfer, display code and recipient; customer sends transfer notice; admin checks bank statement and marks paid with real reference. No automatic bank verification.
- Check customer email recovery only if valid SMTP configuration exists. No fabricated successful email.

## Limits
- No combined checkout for two service packages, no automatic bank IPN, and no production E2E validation against user database.

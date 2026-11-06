# PetDay V6.25 — Pre-arrival intake & compact operations

## What changed
- New customer pre-arrival form inside each active booking: emergency phone, allergy/health alerts, handling instructions, explicit acknowledgement.
- Admin sees submitted notes directly in booking card; assigned staff sees only notes for their bookings.
- Backend checks customer ownership, correct booking status, and absence of check-in before saving; keeps one form per booking.
- No changes to payment status, quote, promotion, or booking time. No automatic medical decisions.
- Refined navy/coral card visuals, responsive fields, focus states; no extra top-level menu.

## Migration & safety
1. Back up PostgreSQL database `petday`.
2. Apply **019_v625_pre_arrival.sql** only after schema 001–018, on the correct `petday` database.
3. Migrate staging/test DB first. This migration only creates a table and does not delete or rewrite existing booking rows.
4. Keep your existing `server/.env` securely; do not put credentials into ZIP or chat.

## Acceptance tests (real database required)
1. Customer A opens own pending booking, submits valid form → saves and appears after refresh.
2. Customer A edits it before check-in → updated information appears for Admin and assigned Staff.
3. Customer A attempts editing another customer's booking code → 404, no modification.
4. Staff/anonymous attempts PUT `/api/bookings/:code/intake` → 403/401.
5. Customer attempts form on cancelled / in-progress / finished booking → 409.
6. Check-in exists despite booking status not yet changed → 409.
7. Bad phone, missing acknowledgement or 601-char note → 400.
8. Staff only sees assigned bookings; health notes must not appear in public listings.
9. Confirm separate cash/bank transfer selection and verify intake changes do not modify prices/payments.
10. Repeat operation on narrow viewport and with keyboard focus; verify errors displayed.

## Unverified
- Production frontend build and end-to-end PostgreSQL testing on user's local system remain required.
- Do not claim automatic reminders, bank reconciliation, or healthcare screening from this new workflow.

## Catalog alignment
- The public service cards now match the three services actually accepted by the booking API: Grooming toàn diện, Spa dưỡng lông, Daycare cả ngày.
- Smaller options remain add-ons in the booking flow. Pricing begins at backend base rates and can increase with weight, taxi and add-ons; discounts are validated server-side.
- The old six marketing service names were not all bookable; V6.25 removes this misleading mismatch.

## Visual reference / design reasoning
- Gingr's client pre-check flow collects pet information and belongings before check-in; this inspired the small collapsible intake section inside each booking, rather than adding a separate main navigation tab.
- MoeGo separates scheduling, records, reminders and payment flows; PetDay keeps the booking as the central record and uses distinct payment state and service progress state.
- References: https://support.gingrapp.com/hc/en-us/articles/29508730127245-Check-In-Using-Gingr-PreCheck-How-To and https://www.moego.pet/help/en

# PetDay V6.38 — 8 service packages, integrated booking and compact UX

## What changed (real source)

- Three **service groups** remain: Grooming / Spa / Daycare. Eight actual bookable packages are provided, not merely eight marketing cards.
- The public ServicesPage has searchable and filterable cards with a **Xem chi tiết gói** expandable section; each CTA passes the exact package name into the booking wizard.
- Booking step 2 displays eight bookable packages in a responsive grid, warns of incompatible species, labels deterministic rule-based suggestions, supports add-ons, and shows a server-backed quote.
- Server `services`, `/api/catalog`, `/api/public/services`, `/api/quote`, `/api/availability`, `/api/availability/day`, `/api/bookings` and booking capacity calculations are updated consistently.
- Price is ALWAYS recomputed on the backend from pet species and weight; the client cannot supply its own price.
- Add-ons, taxi, promotion, cash or bank transfer all reuse existing API processing. Payment selection is not proof of actual payment.
- Existing bookings retain their booked service and stored line-item prices.

## Package matrix (demo business rules to verify with PetDay business owner)

| Category | Package | From (VND) | Est. duration | Species | Capacity units |
|---|---|---:|---:|---|---:|
| Grooming | Grooming cơ bản | 140,000 | 60m | Dog/Cat | 1 |
| Grooming | Grooming toàn diện | 180,000 | 90m | Dog/Cat | 1 |
| Grooming | Grooming tạo kiểu | 260,000 | 120m | Dog | 2 |
| Spa | Spa thư giãn | 220,000 | 90m | Dog/Cat | 2 |
| Spa | Spa dưỡng lông | 280,000 | 120m | Dog/Cat | 2 |
| Spa | Spa phục hồi lông | 350,000 | 150m | Dog/Cat | 2 |
| Daycare | Daycare nửa ngày | 190,000 | 240m | Dog only | 1 |
| Daycare | Daycare cả ngày | 320,000 | 480m | Dog only | 2 |

These are **proposed project prices**, NOT an external provider’s verified pricing. For spa and both daycare services, limited slots/booking hours are inherited and validated on server. A duration is an estimate and not a guarantee of individual staff availability; staff assignment remains a separate Admin flow.

## Mandatory migration

**Backup the current PostgreSQL `petday` first.** Database must already have 001–021, including V6.37 review moderation. Apply ONLY `database/022_v638_service_packages.sql` in pgAdmin Query Tool connected to `petday` after reading it. Do NOT re-run 001–021. Migration updates the `bookings_service_check` constraint and retains every existing row.

Check after migration:

```sql
SELECT conname,pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid='public.bookings'::regclass
  AND conname='bookings_service_check';
```

Expect the CHECK expression to include 8 service names. If pgAdmin shows an error, `ROLLBACK` the current failed transaction, review the **first** error, and do not continue blindly. The existing `/api/health/schema` only checks certain columns/tables; it does **not** check this constraint.

## Installation

1. Extract `PetDay_V6_38_Service_Expansion_Integrated_Full_Source.zip`.
2. Copy the working **private** `server/.env` from V6.37 into the extracted V6.38 `PETDAY_OFFICIAL/server/.env`. Do not share `.env`.
3. Stop the old backend/frontend terminals, avoid conflicting port 4000/8443.
4. In `PETDAY_OFFICIAL/server`: `npm install`, `npm run dev`.
5. In `PETDAY_OFFICIAL`: `npm install`, `npm run dev`.
6. Open `http://localhost:4000/api/health/schema` and `http://localhost:8443/`.

## Acceptance scenarios (execute on TEST accounts, not real payments)

- TC38-01: Public Services lists 8, filtering Grooming shows 3, Spa 3, Daycare 2. Searching by name returns correct package. Details shows species and duration.
- TC38-02: Click `Grooming tạo kiểu` CTA, verify booking wizard starts from this exact package when entering step 2. Add Dog, choose package and review server quote; note extra cost by weight.
- TC38-03: Cat cannot choose `Grooming tạo kiểu`, `Daycare nửa ngày` or `Daycare cả ngày`; dog may choose them if weight eligible.
- TC38-04: Daycare half-day only morning slots. All Spa packages lack 17:30. Disabled/closed/full slots cannot be booked.
- TC38-05: Grooming for 7 kg: 140,000 + 50,000 (unless add-ons/taxi/promotion). Server rejects user-supplied prices.
- TC38-06: Make a new booking, check Admin list and Customer history show the **exact package name**, price and line items, and payment stays unpaid until explicitly collected.
- TC38-07: Add-ons can only be selected if eligible, at most three, no duplicates. Taxi and promotion recalculate total server-side.
- TC38-08: Bank transfer only bookable if real recipient bank configured by Admin; it must not mark a booking as paid.
- TC38-09: Old Grooming/Spa/Daycare bookings remain readable with their original totals and reports.
- TC38-10: Two simultaneous orders for the same last slot must not exceed the capacity limit (database transaction + lock).
- TC38-11: Run Admin → Staff → assignment; check capacity and staff schedule, then Staff → care timeline; verify notification on state transitions.
- TC38-12: Check browser responsive at 390, 768 and 1280 px; step 2 must not overflow horizontally.

## Important business-function gap audit

Already implemented in older versions (still needs integration tests): registration/login/profile, pets, existing appointment history, quotes, slots, add-ons, Pet Taxi, reschedule/cancel, bank-transfer selection, manual reconciliation, review moderation, customer list, staff shifts, care timeline, and in-account reminders. Forgot-password **still requires SMTP**.

NOT implemented as fully tested workflows in V6.38: dynamic Admin CRUD/activation/pricing of service packages (the eight packages are controlled by code), purchased retail products with stock/orders and checkout, automated payment gateway webhook, multi-staff skill scheduling, notification email/SMS, and full E2E regression. Do not claim those work until implemented and tested.

## Validation done in the build environment

- 128/128 existing+new backend unit tests passed.
- Syntax parsing of source TS/TSX using TypeScript completed without error.
- `node --check` on `server/src/server.js` passed.
- Attempt to install frontend dependencies for production Vite build failed due DNS `EAI_AGAIN registry.npmjs.org`. Therefore production build and live PostgreSQL E2E are **NOT VERIFIED**. Run `npm run build` on the user's machine before release.

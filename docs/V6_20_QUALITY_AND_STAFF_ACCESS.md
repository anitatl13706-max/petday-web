# PetDay V6.20 — Focused Administration & Staff Permissions

## What's new
- Admin dashboard is grouped into five focused tabs rather than a long stack: overview, appointments, employees, finance, support.
- Staff members may receive one unique staff login (admin creates with verified email and a temporary password >= 12 characters).
- Staff sees only bookings currently assigned to their active staff profile; no access to admin finance, coupons or full client directory.
- Staff may record check-in, care, ready and checkout only for an assigned booking; the server checks permissions, status and ordering.
- Customer booking/timeline/payments remain linked; staff actions notify customers.

## Upgrade and tests
1. Back up `petday` with pgAdmin. Apply migrations 001–016 in their original order if not yet applied. Then run `database/017_v620_staff_accounts.sql` ONCE.
2. Copy working `server/.env` to new `server/.env`; do not put secrets in ZIP or Git.
3. Run `npm install`, `npm run dev` in `server/` and project root (two separate terminals).
4. Sign in as admin → Employees → create active employee → create shift → assign an already confirmed appointment → provision staff login.
5. In a separate browser/incognito sign in with staff email/password. Staff should see **only** assigned bookings. Attempt GET `/api/admin/finance/summary` with staff credentials: must return HTTP 403.
6. Attempt POST `/api/staff/bookings/WRONGCODE/milestone`: must return HTTP 403; for assigned appointment, check-in must be first and other steps must preserve order.
7. Sign in as customer, confirm service timeline updates and notifications and payment remains separate.
8. Test all five admin tabs on mobile width and confirm the other sections are hidden; check Admin menu navigation.

## Known limitations
- The database migration needs an actual PostgreSQL test on the user's machine.
- Staff authentication uses admin-provisioned temporary passwords rather than an invitation email flow. Admin must deliver credentials privately; employee should change password immediately.
- Staff profile is a scheduling slot holder, not HR attendance/payroll.
- Staff-only UI does not support uploading care photos in V6.20; Admin care reports keep photo upload. The staff workspace supports changing the initial password using the old password.
- Neither online payment settlement nor automated SMS/email reminders are implemented.
- A full browser-based end-to-end suite remains to be added.

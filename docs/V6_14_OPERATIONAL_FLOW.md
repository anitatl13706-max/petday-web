# PetDay V6.14 – Service workflow and operational queue

## References and UI choices
MoeGo's Pet Parent Portal groups appointments, pets, care reports and payments rather than multiplying customer menu items. The admin side separates booking requests, scheduling and attendance. References: https://help.moego.pet/en/articles/14075819-pet-parent-portal-overview and https://help.moego.pet/en/collections/16033809-scheduling. PetDay applies the pattern; it does **not** claim integration with MoeGo.

## Completed code changes
- Server authorizes client / admin to read timelines by booking ownership.
- Server creates append-only service events; prevents check-in twice, ready twice and check-out twice.
- Staff procedure: confirm booking -> check-in (sets in progress) -> care updates (optional and repeatable) -> ready for handover -> check-out (sets completed). Each step creates customer inbox notification in database.
- Client may open the timeline for their own bookings; admin can manage milestones inside the same booking card.
- Admin may filter an indexed booking queue by date and status.
- A manual completion operation is blocked once milestones exist without final check-out, to prevent bypass of the process.
- New schema-ready check warns when service_events migration is missing.

## Installation from V6.13
1. BACK UP existing database petday using pgAdmin.
2. Apply prior migrations through 010, if not already applied.
3. Run **database/011_v614_service_timeline.sql** once in pgAdmin Query Tool on `petday`.
4. Copy working server/.env into the new version; never publish credentials.
5. Stop old frontend/backend to prevent ports 4000 / 8443 from being occupied; npm install then npm run dev in root and server, respectively.
6. Check http://localhost:4000/api/health/schema for schemaReady true.

## Acceptance test checklist
- Customer books and admin confirms: client sees confirmed.
- Admin opens timeline and checks in with note: booking becomes in progress; customer sees event + notification.
- Admin adds care note, marks ready, checks out: becomes completed, customer can review.
- Attempt check-out before ready: 409 and no database changes.
- Attempt duplicate check-in: 409.
- Customer cannot inspect timeline belonging to a different customer: 403.
- Admin date/status filtering returns matching rows.
- Confirm money only after actual cash receipt or bank reconciliation, independently of service status.
- Customer reschedule pending and cancel pending only in allowed booking states.

## Out of scope / not yet verified end to end
VietQR automatic reconciliation, VNPAY, payroll, staff rostering, product inventory, automated email reminders, multi-message live support. Static frontend rendering, PostgreSQL migration and E2E testing need execution on the owner's environment; code review and syntax checks are not substitutes.

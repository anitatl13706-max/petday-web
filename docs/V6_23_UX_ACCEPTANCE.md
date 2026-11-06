# PetDay V6.23 – Compact UX & acceptance

## What changed
- Customer appointment area becomes four tabs: Lịch hẹn, Thanh toán, Hoàn tiền, Đánh giá. Data comes from existing authenticated API endpoints; hiding sections never grants or removes server permissions.
- The next active booking is summarized above the tab switcher, with a single action to book again.
- Booking status labels have distinct semantic treatments; mobile buttons are at least 44px tall.
- Existing Admin tabs, staff roles, price calculations, financial audit, notifications, and Pet Taxi are retained.
- No new PostgreSQL migration or API endpoint in this release. No bank automation is claimed.

## Manual verification on localhost
1. Customer with 0 bookings: see helpful empty state; all four tabs work without errors.
2. Customer with multiple bookings: summary shows earliest upcoming active booking, filtering and sorting remain interactive.
3. Switch each tab: precisely one of appointment list, payments, refunds, reviews is displayed, while the overview remains.
4. From account menu click Payment/Review: correct page section/tab is selected.
5. Payment method remains cash/bank transfer with server gating for bank information. Confirm no automatic paid flag.
6. Admin tabs: only relevant panels visible and all previous operations usable.
7. Staff login: only assigned jobs, no finance actions.
8. Check 375px viewport and keyboard Tab/Enter controls.
9. Cross-check `/api/health/schema`; database still requires migrations through SQL 018.
10. Verify no customer can access another customer's records.

## Important limits
A clean syntax scan and successful Node unit tests do NOT replace Vite build, PostgreSQL integration tests, or a complete security audit. No backend business logic was rewritten here.

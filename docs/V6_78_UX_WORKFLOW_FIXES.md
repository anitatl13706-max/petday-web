# PetDay V6.78 — UX & business-flow fixes

- Inline assignment feedback: choosing the same assignee doesn't cause 409; server continues enforcing real conflicts. Assignment errors are shown above the staff section and should be investigated if persistent.
- Care milestones: notes are optional. When blank, backend records a default audit note (start/update/ready/completed). Dates/user/event are still persisted. Real service steps still require valid status and taxi handover when applicable.
- Customer pet profile: gender = Đực/Cái/Chưa xác định. Migration 041 required on TEST before running this version's /pets endpoints. Back up first; do not rerun old migrations. Existing pets default to Chưa xác định.
- Grooming toàn diện is configured for both Chó and Mèo in servicePackages, Booking and backend rules. If cat is disabled, check individual pet metadata and service_price_settings.is_active, not gender.
- Shop checkout: no empty-cart alert after successful order. A success message with order code and history guidance remains. Validation errors appear only when an order is being prepared or submitted. Checkout is disabled for empty carts.

## Suggested targeted checks
1. After migration 041, create/edit pet gender; reload; verify /api/pets does not return 503.
2. Grooming toàn diện for a cat: verify eligible and place a valid booking.
3. Admin assign same worker: no 409 or misleading success. Change worker: inline confirmation and staff display updated.
4. Start care with blank note; DB service_events should store a default note. Complete via prescribed event/state flow.
5. Create a shop order; cart empties, yellow error stays hidden, order is in history after refresh.
6. Try invalid delivery fields with a nonempty cart; see exact validation near Checkout.

Automated backend tests/syntax checks do not substitute for E2E tests with real PostgreSQL and authenticated Customer/Admin.
